<div align="center">

# 🌙🦖 KimiClaw 
### *Your Personal AI Agent, Powered by Moonshot AI on Cloudflare*

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yksanjo/moltworker2)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Kimi API](https://img.shields.io/badge/Powered%20by-Kimi%20(Moonshot)-ff6b6b)](https://platform.moonshot.cn/)
[![Cloudflare Workers](https://img.shields.io/badge/Runs%20on-Cloudflare%20Sandbox-f48120)](https://developers.cloudflare.com/sandbox/)
[![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6)](https://www.typescriptlang.org/)

**🚀 Deploy your own AI assistant in minutes. No servers to manage. Always on.**

[📖 Quick Start](#quick-start) • [🚀 Deploy](#deploy-in-30-seconds) • [💬 Connect](#chat-channels) • [🔧 Config](#configuration)

</div>

---

## ✨ What is KimiClaw? 🦖

**KimiClaw** 🦖 is a **serverless AI agent platform** that runs [Kimi](https://platform.moonshot.cn/) (Moonshot AI's powerful LLM) on [Cloudflare's edge infrastructure](https://developers.cloudflare.com/sandbox/). 

Think of it as your personal AI claw-sistant that 🦖:
- 🧠 **Runs Kimi (Moonshot AI)** — China's most capable LLM, now globally accessible
- 💬 **Connects everywhere** — Telegram, Discord, Slack, WhatsApp, Web UI
- 🔒 **Secure by design** — Device pairing, Cloudflare Access, encrypted storage
- 🌍 **Runs at the edge** — 300+ locations worldwide, low latency
- 💰 **Costs pennies** — $5/month Workers plan, pay only for what you use

> ☁️ **Zero servers. Zero maintenance. Just intelligence.**

---

## 🚀 Deploy in 30 Seconds

```bash
# 1. Clone & install
git clone https://github.com/yksanjo/moltworker2.git kimiclaw
cd kimiclaw && npm install

# 2. Set your Kimi API key (get one at platform.moonshot.cn)
npx wrangler secret put KIMI_API_KEY

# 3. Set a gateway token for security
export TOKEN=$(openssl rand -hex 32)
echo $TOKEN | npx wrangler secret put OPENCLAW_GATEWAY_TOKEN
echo "Your gateway token: $TOKEN"

# 4. Deploy!
npm run deploy
```

**That's it!** Your AI agent is now live at `https://your-app.workers.dev`

---

## 🖥️ Features

### 🤖 AI Models
- ✅ **Kimi (Moonshot AI)** — Primary provider, fully supported
- ✅ **DeepSeek** — Alternative Chinese LLM
- ✅ **Anthropic Claude** — Fallback option
- ✅ **OpenAI GPT** — Via AI Gateway
- ✅ **Any OpenAI-compatible API** — Flexibility to choose

### 💬 Chat Channels
| Platform | Status | Setup Time |
|----------|--------|------------|
| 🌐 **Web UI** | ✅ Built-in | 0 min |
| 📱 **Telegram** | ✅ Full support | 2 min |
| 💜 **Discord** | ✅ Full support | 2 min |
| 💼 **Slack** | ✅ Full support | 3 min |
| 💬 **WhatsApp** | ✅ Full support | 5 min |

### 🔧 Built-in Capabilities
- 🌐 **Browser Automation** — Screenshot, scrape, automate with Puppeteer
- 💾 **Persistent Memory** — R2 storage for conversations & configs
- 🔐 **Device Pairing** — Approve devices before they can access
- 📊 **Admin Dashboard** — Web UI for managing everything
- 🔄 **Auto-backup** — Data syncs every 5 minutes
- 🛡️ **Cloudflare Access** — Enterprise-grade authentication

---

## 📖 Quick Start

### Prerequisites
- [Cloudflare Workers Paid Plan](https://www.cloudflare.com/plans/developer-platform/) ($5/month)
- [Kimi API Key](https://platform.moonshot.cn/) (free tier available)

### Step 1: Get Your Kimi API Key

1. Go to [platform.moonshot.cn](https://platform.moonshot.cn/)
2. Create an account and generate an API key
3. Copy the key for the next step

### Step 2: Configure & Deploy

```bash
# Install dependencies
npm install

# Set your Kimi API key
npx wrangler secret put KIMI_API_KEY
# Enter your key when prompted

# Generate a secure gateway token
export OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
echo "Save this token: $OPENCLAW_GATEWAY_TOKEN"
echo "$OPENCLAW_GATEWAY_TOKEN" | npx wrangler secret put OPENCLAW_GATEWAY_TOKEN

# Deploy to Cloudflare
npm run deploy
```

### Step 3: Access Your Agent

Open your browser:
```
https://your-worker.workers.dev/?token=YOUR_GATEWAY_TOKEN
```

🎉 **You're in!** Start chatting with your personal AI agent.

---

## 💬 Chat Channels

### Telegram Bot
```bash
# 1. Create a bot with @BotFather, get the token
# 2. Set the secret
npx wrangler secret put TELEGRAM_BOT_TOKEN

# 3. Redeploy
npm run deploy
```

### Discord Bot
```bash
npx wrangler secret put DISCORD_BOT_TOKEN
npm run deploy
```

### Slack App
```bash
npx wrangler secret put SLACK_BOT_TOKEN
npx wrangler secret put SLACK_APP_TOKEN
npm run deploy
```

### WhatsApp Business
```bash
npx wrangler secret put WHATSAPP_BUSINESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put WHATSAPP_WEBHOOK_TOKEN
npm run deploy
```

---

## 🔧 Configuration

### Required Secrets

| Secret | Description | Get It From |
|--------|-------------|-------------|
| `KIMI_API_KEY` | Your Kimi/Moonshot API key | [platform.moonshot.cn](https://platform.moonshot.cn/) |
| `OPENCLAW_GATEWAY_TOKEN` | Secure token for accessing your agent | Generate with `openssl rand -hex 32` |

### Optional Secrets

| Secret | Description |
|--------|-------------|
| `KIMI_BASE_URL` | Custom Kimi endpoint (default: `https://api.moonshot.cn/v1`) |
| `CF_ACCESS_TEAM_DOMAIN` | Cloudflare Access team domain for admin protection |
| `CF_ACCESS_AUD` | Cloudflare Access Application Audience tag |
| `R2_ACCESS_KEY_ID` | R2 storage access key for persistence |
| `R2_SECRET_ACCESS_KEY` | R2 storage secret key |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |

### Local Development

Create `.dev.vars` for local testing:
```bash
DEV_MODE=true               # Skip auth in development
DEBUG_ROUTES=true           # Enable debug endpoints
KIMI_API_KEY=your-key-here  # Your Kimi API key
```

---

## 🛡️ Security

KimiClaw 🦖 implements multiple security layers:

1. **🔐 Gateway Token** — Required to access the Control UI
2. **👤 Cloudflare Access** — SSO/authentication for admin routes
3. **📱 Device Pairing** — Each device must be explicitly approved
4. **🗄️ Encrypted Storage** — R2 data encrypted at rest
5. **🔒 HTTPS Only** — All traffic encrypted in transit

---

## 🌟 Why KimiClaw? 🦖

| Feature | KimiClaw 🦖 | Self-Hosted | Other Cloud |
|---------|----------|-------------|-------------|
| **Setup Time** | ⏱️ 5 minutes | 🕐 Hours | ⏱️ 15 minutes |
| **Maintenance** | 🚫 None | 🔧 Constant | 🚫 None |
| **Global CDN** | ✅ 300+ locations | ❌ DIY | ⚠️ Limited |
| **Cost** | 💰 $5/month + usage | 💰💰💰 Variable | 💰💰 Higher |
| **Kimi API** | ✅ Native | 🔧 Configure | ❌ Not available |
| **Persistent Storage** | ✅ Built-in | 🔧 DIY | 💰 Extra cost |

---

## 🧪 Advanced Features

### Browser Automation (CDP)

Enable headless browser automation:
```bash
npx wrangler secret put CDP_SECRET
npx wrangler secret put WORKER_URL  # https://your-app.workers.dev
npm run deploy
```

**Capabilities:**
- 📸 Take screenshots
- 🎬 Record videos of web pages
- 🤖 Automated testing
- 🔍 Web scraping

### AI Gateway Integration

Route through Cloudflare AI Gateway for analytics:
```bash
npx wrangler secret put AI_GATEWAY_API_KEY
npx wrangler secret put AI_GATEWAY_BASE_URL
npm run deploy
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Unauthorized" error** | Enable Cloudflare Containers in your dashboard |
| **Gateway won't start** | Check `npx wrangler tail` for logs |
| **Slow first request** | Cold start takes 1-2 min. Container stays warm after |
| **Lost my gateway token** | Run `npx wrangler secret put OPENCLAW_GATEWAY_TOKEN` with a new token |
| **R2 not working** | Verify all 3 R2 secrets are set + redeploy |

---

## 📸 Screenshots

> 🎨 *Screenshots coming soon!* 
> 
> Want to contribute screenshots? Open a PR!

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/yksanjo/moltworker2.git
cd moltworker2
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your keys
npm run dev
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) file.

---

## 🔗 Links

- 🌙 [Kimi/Moonshot AI](https://platform.moonshot.cn/)
- 📚 [Kimi API Docs](https://platform.moonshot.cn/docs)
- ☁️ [Cloudflare Sandbox Docs](https://developers.cloudflare.com/sandbox/)
- 🐦 [Twitter/X](https://twitter.com/yksanjo)
- 💬 [Discussions](https://github.com/yksanjo/moltworker2/discussions)

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

Made with ❤️🦖 by [@yksanjo](https://github.com/yksanjo)

</div>
