import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { findExistingOpenClawProcess } from '../gateway';

/**
 * Debug routes for inspecting container state
 * Note: These routes should be protected by Cloudflare Access middleware
 * when mounted in the main app
 */
const debug = new Hono<AppEnv>();

// GET /debug/version - Returns version info from inside the container
debug.get('/version', async (c) => {
  const sandbox = c.get('sandbox');
  try {
    // Get OpenClaw version
    const versionProcess = await sandbox.startProcess('openclaw --version');
    await new Promise(resolve => setTimeout(resolve, 500));
    const versionLogs = await versionProcess.getLogs();
    const openclawVersion = (versionLogs.stdout || versionLogs.stderr || '').trim();

    // Get node version
    const nodeProcess = await sandbox.startProcess('node --version');
    await new Promise(resolve => setTimeout(resolve, 500));
    const nodeLogs = await nodeProcess.getLogs();
    const nodeVersion = (nodeLogs.stdout || '').trim();

    return c.json({
      openclaw_version: openclawVersion,
      node_version: nodeVersion,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ status: 'error', message: `Failed to get version info: ${errorMessage}` }, 500);
  }
});

// GET /debug/processes - List all processes with optional logs
debug.get('/processes', async (c) => {
  const sandbox = c.get('sandbox');
  try {
    const processes = await sandbox.listProcesses();
    const includeLogs = c.req.query('logs') === 'true';

    const processData = await Promise.all(processes.map(async p => {
      const data: Record<string, unknown> = {
        id: p.id,
        command: p.command,
        status: p.status,
        startTime: p.startTime?.toISOString(),
        endTime: p.endTime?.toISOString(),
        exitCode: p.exitCode,
      };

      if (includeLogs) {
        try {
          const logs = await p.getLogs();
          data.stdout = logs.stdout || '';
          data.stderr = logs.stderr || '';
        } catch {
          data.logs_error = 'Failed to retrieve logs';
        }
      }

      return data;
    }));

    // Sort by status (running first, then starting, completed, failed)
    // Within each status, sort by startTime descending (newest first)
    const statusOrder: Record<string, number> = {
      'running': 0,
      'starting': 1,
      'completed': 2,
      'failed': 3,
    };
    
    processData.sort((a, b) => {
      const statusA = statusOrder[a.status as string] ?? 99;
      const statusB = statusOrder[b.status as string] ?? 99;
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      // Within same status, sort by startTime descending
      const timeA = a.startTime as string || '';
      const timeB = b.startTime as string || '';
      return timeB.localeCompare(timeA);
    });

    return c.json({ count: processes.length, processes: processData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

// GET /debug/gateway-api - Probe the OpenClaw gateway HTTP API
debug.get('/gateway-api', async (c) => {
  const sandbox = c.get('sandbox');
  const path = c.req.query('path') || '/';
  const OPENCLAW_PORT = 18789;

  try {
    const url = `http://localhost:${OPENCLAW_PORT}${path}`;
    const response = await sandbox.containerFetch(new Request(url), OPENCLAW_PORT);

    // Try to get response body
    let body;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return c.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

// GET /debug/gateway-process - Get details about the running gateway process
debug.get('/gateway-process', async (c) => {
  const sandbox = c.get('sandbox');
  
  try {
    const process = await findExistingOpenClawProcess(sandbox);
    
    if (!process) {
      return c.json({ 
        found: false,
        message: 'No OpenClaw gateway process found'
      });
    }

    // Get logs
    let logs = { stdout: '', stderr: '' };
    try {
      logs = await process.getLogs();
    } catch {
      // Ignore logs error
    }

    return c.json({
      found: true,
      process: {
        id: process.id,
        command: process.command,
        status: process.status,
        startTime: process.startTime?.toISOString(),
        endTime: process.endTime?.toISOString(),
        exitCode: process.exitCode,
        logs: {
          stdout: logs.stdout || '',
          stderr: logs.stderr || '',
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

// GET /debug/env - Show environment variables (safe ones only, no secrets)
debug.get('/env', async (c) => {
  const sandbox = c.get('sandbox');
  
  // Build safe env var list (no secrets)
  const safeEnv: Record<string, string | boolean | undefined> = {
    has_gateway_token: !!c.env.OPENCLAW_GATEWAY_TOKEN,
    bind_mode: c.env.OPENCLAW_BIND_MODE,
    dev_mode: c.env.DEV_MODE,
    has_r2_config: !!(c.env.R2_ACCESS_KEY_ID && c.env.R2_SECRET_ACCESS_KEY),
    has_cf_account: !!c.env.CF_ACCOUNT_ID,
    ai_gateway_base_url: c.env.AI_GATEWAY_BASE_URL,
  };

  return c.json({
    env: safeEnv,
  });
});

// GET /debug/container-config - Read the OpenClaw config from inside the container
debug.get('/container-config', async (c) => {
  const sandbox = c.get('sandbox');
  
  try {
    const proc = await sandbox.startProcess('cat /root/.openclaw/openclaw.json');
    await new Promise(resolve => setTimeout(resolve, 500));
    const logs = await proc.getLogs();
    
    let config;
    try {
      config = JSON.parse(logs.stdout || '{}');
    } catch {
      config = { parseError: true, raw: logs.stdout };
    }

    return c.json({
      config,
      stderr: logs.stderr,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

// GET /debug/cli - Test OpenClaw CLI commands
debug.get('/cli', async (c) => {
  const sandbox = c.get('sandbox');
  const cmd = c.req.query('cmd') || 'openclaw --help';
  
  try {
    const proc = await sandbox.startProcess(cmd);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const logs = await proc.getLogs();

    return c.json({
      command: cmd,
      exitCode: proc.exitCode,
      stdout: logs.stdout,
      stderr: logs.stderr,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

export { debug };
