# Running Agent Locally (Self-Hosted)

Guide to switch from LiveKit Cloud agent to running the agent locally on your machine.

## 🎯 Overview

When running the agent locally, you have two options:

1. **Local LiveKit Server** - Run LiveKit server locally (for complete local setup)
2. **Local Agent + LiveKit Cloud** - Run agent locally but connect to LiveKit Cloud server

This guide covers **Option 2** (most common) - running the agent locally while using LiveKit Cloud for the server.

## 📋 Prerequisites

- Python 3.11+ installed
- All API keys ready (same as for Cloud deployment)
- Agent dependencies installed

## 🚀 Setup Steps

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd /Users/oleksandrtroshchenko/IdeaProjects/other/aime

# Install Python dependencies
pip install -r agents/requirements.txt
```

### Step 2: Configure Environment Variables

Your `.env` file already has all the required variables. Verify these are set:

```bash
# LiveKit Configuration (for connecting to LiveKit Cloud server)
LIVEKIT_URL=wss://aisha-966mjgrn.livekit.cloud
LIVEKIT_API_KEY=APIfmg4gZDgAQTM
LIVEKIT_API_SECRET=hmo7zpHHpIoQgnyTNBGbHuoXMh268LgboxbUWCqhReY

# Hedra Avatar
HEDRA_API_KEY=sk_hedra_TRCYPF6tugJOdst1gyZgGdrAIbTgmYSMcwUSAotGZFzzQgd9a-L6kn7aLWmke6hV
HEDRA_AVATAR_ID=b35096b3-1f67-4a2c-aea5-684929ac64be

# AI Services
OPENAI_API_KEY=sk-proj-zoiarJoUDxUa1j0X1zBUT3BlbkFJwHvx9SxCUFqYxmKiTc1m
# OR
OPENROUTER_API_KEY=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

# Speech-to-Text
DEEPGRAM_API_KEY=08bac43bb03f83713429cc355b5aac7760f53e25

# Text-to-Speech
ELEVEN_API_KEY=c10cec2b06940fe6540fa3e445ae55edb4351904fd412a4d3d4aba297cf77108
```

### Step 3: Run the Agent Locally

#### Development Mode (with auto-reload):

```bash
# From project root
python agents/hedra_agent.py dev
```

#### Production Mode:

```bash
# From project root
python agents/hedra_agent.py start
```

### Step 4: Verify Agent is Running

You should see output like:

```
Loaded environment variables from: /path/to/.env
Starting Hedra avatar session for room: ...
Connected to room: ...
Initializing conversational AI components...
✓ Deepgram STT initialized
✓ OpenAI LLM initialized
✓ ElevenLabs TTS initialized with voice: ...
Voice agent created
✓ Avatar session started
Hedra avatar with conversational AI started successfully for room: ...
Avatar is now listening and ready to respond!
```

## 🔄 How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│ LiveKit Cloud│◀────────│ Local Agent │
│  (Next.js)  │         │   Server     │         │  (Your Mac) │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │ 1. Create Room         │                        │
      ├───────────────────────▶│                        │
      │                        │                        │
      │ 2. Connect to Room     │                        │
      ├───────────────────────▶│                        │
      │                        │                        │
      │                        │ 3. Agent Connects      │
      │                        │◀───────────────────────┤
      │                        │                        │
      │ 4. Video/Audio Stream  │                        │
      │◀───────────────────────┼───────────────────────▶│
      │                        │                        │
```

**Key Point:** The agent runs on your local machine but connects to the LiveKit Cloud server. The frontend and agent both connect to the same LiveKit Cloud project.

## ⚙️ Configuration Options

### Option A: Use LiveKit Cloud Server (Current Setup)

**Pros:**
- ✅ No need to run LiveKit server locally
- ✅ Uses LiveKit Cloud infrastructure
- ✅ Easy to test

**Cons:**
- ❌ Agent must be running on your machine
- ❌ Not suitable for production

**Configuration:**
- Keep `LIVEKIT_URL=wss://aisha-966mjgrn.livekit.cloud` in `.env`
- Run agent locally: `python agents/hedra_agent.py dev`

### Option B: Fully Local (Local LiveKit Server)

**Pros:**
- ✅ Complete local control
- ✅ No cloud dependencies
- ✅ Good for development

**Cons:**
- ❌ Need to run LiveKit server locally
- ❌ More complex setup

**Configuration:**
1. Install and run LiveKit server locally
2. Update `.env`:
   ```bash
   LIVEKIT_URL=ws://localhost:7880
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   ```
3. Update frontend `.env`:
   ```bash
   NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
   ```

## 🧪 Testing Local Agent

### 1. Start the Agent

```bash
python agents/hedra_agent.py dev
```

### 2. Test Frontend Connection

1. Open your Next.js app (make sure it's running)
2. Click the Hedra video call button
3. Check agent terminal for logs:
   ```
   Starting Hedra avatar session for room: hedra-room-...
   Connected to room: hedra-room-...
   ```

### 3. Verify Agent Joins

In the agent terminal, you should see:
- Room connection messages
- Component initialization (STT, LLM, TTS)
- Avatar session started
- "Avatar is now listening and ready to respond!"

## 🔄 Switching Between Local and Cloud Agent

### To Use Local Agent:

1. **Stop Cloud Agent** (if running):
   ```bash
   # No need to delete, just don't use it
   # Or pause it in LiveKit Cloud dashboard
   ```

2. **Start Local Agent**:
   ```bash
   python agents/hedra_agent.py dev
   ```

3. **Keep Frontend as-is** - No changes needed!

### To Use Cloud Agent:

1. **Stop Local Agent**:
   - Press `Ctrl+C` in the terminal running the agent

2. **Deploy/Start Cloud Agent**:
   ```bash
   lk agent deploy agents/
   # Or check status
   lk agent status
   ```

3. **Frontend works automatically** - No changes needed!

## 🐛 Troubleshooting

### Agent Not Connecting

**Problem:** Local agent doesn't connect to LiveKit Cloud.

**Solutions:**
1. Verify `LIVEKIT_URL` in `.env`:
   ```bash
   grep LIVEKIT_URL .env
   # Should be: wss://aisha-966mjgrn.livekit.cloud
   ```

2. Check API keys are correct:
   ```bash
   grep LIVEKIT_API .env
   ```

3. Verify agent can reach LiveKit Cloud:
   ```bash
   # Test connection
   curl -I https://aisha-966mjgrn.livekit.cloud
   ```

### "Missing required API keys"

**Problem:** Agent fails to start due to missing keys.

**Solutions:**
1. Check all required keys in `.env`:
   - `HEDRA_API_KEY`
   - `DEEPGRAM_API_KEY`
   - `ELEVEN_API_KEY`
   - `OPENAI_API_KEY` or `OPENROUTER_API_KEY`

2. Verify `.env` file is in project root (not in `agents/`)

3. Check agent loads `.env`:
   ```
   Loaded environment variables from: /path/to/.env
   ```

### Agent Connects But Doesn't Respond

**Problem:** Agent joins room but doesn't respond to voice.

**Solutions:**
1. Check agent logs for initialization errors
2. Verify all AI service keys are valid
3. Check microphone permissions (for local testing)
4. Verify `HEDRA_AVATAR_ID` is correct UUID

## 📝 Development Workflow

### Recommended Setup for Development:

1. **Run Frontend:**
   ```bash
   pnpm dev
   ```

2. **Run Agent Locally:**
   ```bash
   # In separate terminal
   python agents/hedra_agent.py dev
   ```

3. **Test Changes:**
   - Make code changes to agent
   - Agent auto-reloads in `dev` mode
   - Test immediately

### Production Deployment:

Use LiveKit Cloud agent:
```bash
lk agent deploy agents/
```

## 🎯 Quick Reference

### Start Local Agent (Development)
```bash
python agents/hedra_agent.py dev
```

### Start Local Agent (Production Mode)
```bash
python agents/hedra_agent.py start
```

### Stop Local Agent
```bash
# Press Ctrl+C in the terminal
```

### Switch to Cloud Agent
```bash
lk agent deploy agents/
lk agent status
```

### Switch to Local Agent
```bash
# Stop cloud agent (or just start local)
python agents/hedra_agent.py dev
```

## ⚡ Key Differences: Local vs Cloud Agent

| Feature | Local Agent | Cloud Agent |
|---------|-------------|-------------|
| **Setup** | Run `python agents/hedra_agent.py dev` | `lk agent create agents/` |
| **Availability** | Only when your machine is on | Always available |
| **Auto-reload** | Yes (in dev mode) | No (need to redeploy) |
| **Scaling** | Single instance | Auto-scales |
| **Cost** | Free (your machine) | LiveKit Cloud pricing |
| **Best for** | Development, testing | Production |

## 📚 Additional Resources

- [Agent README](./README.md) - Full agent documentation
- [Environment Variables](./ENV_VARIABLES.md) - Complete env var reference
- [Deployment Guide](./DEPLOY_STEPS.md) - Cloud deployment steps
