import type { Sandbox, Process } from '@cloudflare/sandbox';
import type { OpenClawEnv } from '../types';
import { OPENCLAW_PORT, STARTUP_TIMEOUT_MS } from '../config';
import { buildEnvVars } from './env';
import { mountR2Storage } from './r2';

/**
 * Find an existing OpenClaw gateway process
 * 
 * @param sandbox - The sandbox instance
 * @returns The process if found and running/starting, null otherwise
 */
export async function findExistingOpenClawProcess(sandbox: Sandbox): Promise<Process | null> {
  try {
    const processes = await sandbox.listProcesses();
    for (const proc of processes) {
      // Only match the gateway process, not CLI commands like "openclaw devices list"
      const isGatewayProcess = 
        proc.command.includes('start-openclaw.sh') ||
        proc.command.includes('openclaw gateway');
      const isCliCommand = 
        proc.command.includes('openclaw devices') ||
        proc.command.includes('openclaw --version');
      
      if (isGatewayProcess && !isCliCommand) {
        if (proc.status === 'starting' || proc.status === 'running') {
          return proc;
        }
      }
    }
  } catch (e) {
    console.log('Could not list processes:', e);
  }
  return null;
}

/**
 * Ensure the OpenClaw gateway is running
 * 
 * This will:
 * 1. Mount R2 storage if configured
 * 2. Check for an existing gateway process
 * 3. Wait for it to be ready, or start a new one
 * 
 * @param sandbox - The sandbox instance
 * @param env - Worker environment bindings
 * @returns The running gateway process
 */
export async function ensureOpenClawGateway(sandbox: Sandbox, env: OpenClawEnv): Promise<Process> {
  // Mount R2 storage for persistent data (non-blocking if not configured)
  // R2 is used as a backup - the startup script will restore from it on boot
  await mountR2Storage(sandbox, env);

  // Check if OpenClaw is already running or starting
  const existingProcess = await findExistingOpenClawProcess(sandbox);
  if (existingProcess) {
    console.log('Found existing OpenClaw process:', existingProcess.id, 'status:', existingProcess.status);

    // Always use full startup timeout - a process can be "running" but not ready yet
    // (e.g., just started by another concurrent request). Using a shorter timeout
    // causes race conditions where we kill processes that are still initializing.
    try {
      console.log('Waiting for OpenClaw gateway on port', OPENCLAW_PORT, 'timeout:', STARTUP_TIMEOUT_MS);
      await existingProcess.waitForPort(OPENCLAW_PORT, { mode: 'tcp', timeout: STARTUP_TIMEOUT_MS });
      console.log('OpenClaw gateway is reachable');
      return existingProcess;
    } catch (e) {
      // Timeout waiting for port - process is likely dead or stuck, kill and restart
      console.log('Existing process not reachable after full timeout, killing and restarting...');
      try {
        await existingProcess.kill();
      } catch (killError) {
        console.log('Failed to kill process:', killError);
      }
    }
  }

  // Start a new OpenClaw gateway
  console.log('Starting new OpenClaw gateway...');
  const envVars = buildEnvVars(env);
  const command = '/usr/local/bin/start-openclaw.sh';

  console.log('Starting process with command:', command);
  console.log('Environment vars being passed:', Object.keys(envVars));

  let process: Process;
  try {
    process = await sandbox.startProcess(command, {
      env: Object.keys(envVars).length > 0 ? envVars : undefined,
    });
    console.log('Process started with id:', process.id, 'status:', process.status);
  } catch (startErr) {
    console.error('Failed to start process:', startErr);
    throw startErr;
  }

  // Wait for the gateway to be ready
  try {
    console.log('[Gateway] Waiting for OpenClaw gateway to be ready on port', OPENCLAW_PORT);
    await process.waitForPort(OPENCLAW_PORT, { mode: 'tcp', timeout: STARTUP_TIMEOUT_MS });
    console.log('[Gateway] OpenClaw gateway is ready!');

    const logs = await process.getLogs();
    if (logs.stdout) console.log('[Gateway] stdout:', logs.stdout);
    if (logs.stderr) console.log('[Gateway] stderr:', logs.stderr);
  } catch (e) {
    console.error('[Gateway] waitForPort failed:', e);
    try {
      const logs = await process.getLogs();
      console.error('[Gateway] startup failed. Stderr:', logs.stderr);
      console.error('[Gateway] startup failed. Stdout:', logs.stdout);
      throw new Error(`OpenClaw gateway failed to start. Stderr: ${logs.stderr || '(empty)'}`);
    } catch (logErr) {
      console.error('[Gateway] Failed to get logs:', logErr);
      throw e;
    }
  }

  // Verify gateway is actually responding
  console.log('[Gateway] Verifying gateway health...');
  
  return process;
}
