# Complete LiveKit Cloud Agent Deployment Plan

Complete step-by-step guide to create and deploy your Hedra agent to LiveKit Cloud.

## 📋 Prerequisites Checklist

- [ ] LiveKit CLI installed (`brew install livekit-cli`)
- [ ] Authenticated with LiveKit Cloud (`lk cloud auth`)
- [ ] All API keys ready (see ENV_VARIABLES.md)

## 🚀 Step-by-Step Deployment

### Step 1: Authenticate with LiveKit Cloud

```bash
lk cloud auth
```

**What happens:**
- Opens browser for Google login
- Prompts for device name (enter any name, e.g., "My Mac")
- Links your CLI to LiveKit Cloud account

### Step 2: Set All Required Secrets

Set all API keys as secrets (these will be injected as environment variables):

```bash
# Hedra Avatar (Required)
lk agent secrets set HEDRA_API_KEY="your-hedra-api-key"
lk agent secrets set HEDRA_AVATAR_ID="your-avatar-uuid"

# AI Services (Required - choose one)
lk agent secrets set OPENAI_API_KEY="your-openai-api-key"
# OR use OpenRouter (cheaper alternative)
lk agent secrets set OPENROUTER_API_KEY="your-openrouter-api-key"

# Speech-to-Text (Required)
lk agent secrets set DEEPGRAM_API_KEY="your-deepgram-api-key"

# Text-to-Speech (Required)
lk agent secrets set ELEVEN_API_KEY="your-elevenlabs-api-key"

# Optional: Custom voice
lk agent secrets set ELEVENLABS_VOICE_ID="your-voice-id"
```

**Note:** You can set secrets before or after creating the agent. If you set them before, they'll be applied during creation.

### Step 3: Create the Agent (First Time Only)

Navigate to your project root and run:

```bash
lk agent create agents/
```

**What happens:**
- CLI will prompt you to select a region (choose closest to your users)
- Creates the agent in LiveKit Cloud
- Generates/updates `livekit.toml` with agent ID
- Builds Docker image from `agents/Dockerfile`
- Deploys the agent

**Alternative with region specified:**

```bash
lk agent create --region us-east-1 agents/
```

**Available regions:**
- `us-east` - US East (Ashburn, Virginia)
- `eu-central` - Europe (Frankfurt, Germany) ⭐ **Recommended for EU users/ElevenLabs**

**⚠️ Region Selection Tip:**
- If you're in EU or using ElevenLabs (which has EU servers), use `eu-central` to avoid latency issues
- US East (`us-east`) can cause "no audio frames" errors with ElevenLabs due to cross-Atlantic latency
- Region is immutable - cannot be changed after creation

### Step 4: Verify Deployment

Check agent status:

```bash
lk agent status
```

View logs:

```bash
# Real-time logs
lk agent logs

# Follow logs (like tail -f)
lk agent logs --follow
```

### Step 5: Update Secrets (If Needed Later)

If you need to update secrets after deployment:

```bash
lk agent update-secrets \
  --secrets HEDRA_API_KEY="new-key" \
  --secrets OPENAI_API_KEY="new-key"
```

Or update from a file:

```bash
lk agent update-secrets --secrets-file ./secrets.env
```

## 🔄 Updating the Agent (After Initial Creation)

After making code changes, redeploy:

```bash
lk agent deploy agents/
```

This will:
- Build new Docker image with your changes
- Deploy new version using rolling deployment
- Old instances gracefully shut down after active sessions complete

## 📊 Useful Commands

### Check Agent Status
```bash
lk agent status
```

### View Logs
```bash
# Deploy logs (build/deployment)
lk agent logs --log-type deploy

# Runtime logs (agent execution)
lk agent logs --log-type deploy
```

### List All Agents
```bash
lk agent list
```

### View Secrets (keys only, not values)
```bash
lk agent secrets
```

### Restart Agent
```bash
lk agent restart
```

### Rollback to Previous Version
```bash
lk agent rollback
```

### Delete Agent
```bash
lk agent delete
```

## 🎯 Quick Reference: Complete First-Time Setup

```bash
# 1. Authenticate
lk cloud auth

# 2. Set secrets
lk agent secrets set HEDRA_API_KEY="your-key"
lk agent secrets set HEDRA_AVATAR_ID="your-uuid"
lk agent secrets set OPENAI_API_KEY="your-key"
lk agent secrets set DEEPGRAM_API_KEY="your-key"
lk agent secrets set ELEVEN_API_KEY="your-key"

# 3. Create and deploy
lk agent create agents/

# 4. Verify
lk agent status
lk agent logs
```

## 🎯 Quick Reference: Update After Code Changes

```bash
# Just redeploy
lk agent deploy agents/

# Check status
lk agent status
```

## ⚠️ Important Notes

1. **LiveKit credentials are auto-injected** - Don't set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, or `LIVEKIT_API_SECRET`

2. **First time = `create`** - Use `lk agent create` for new agents

3. **Updates = `deploy`** - Use `lk agent deploy` for subsequent updates

4. **Secrets persist** - Once set, secrets remain until you update them

5. **Rolling deployment** - New versions deploy without interrupting active sessions

6. **Build timeout** - Builds must complete within 10 minutes

## 🐛 Troubleshooting

### "agent ID or [livekit.toml] required"
- **Solution:** Use `lk agent create` instead of `lk agent deploy` for first-time setup

### "project does not match agent subdomain"
- **Solution:** Check `livekit.toml` has correct `subdomain` in `[project]` section
- Run `lk agent config --id AGENT_ID` to regenerate config

### Build fails
- Check `agents/Dockerfile` exists and is valid
- Verify `agents/requirements.txt` is correct
- Ensure build completes within 10 minutes

### Agent not connecting
- Verify all secrets are set: `lk agent secrets`
- Check logs: `lk agent logs`
- Ensure project is active in dashboard

## 📚 Additional Resources

- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- [LiveKit Agent Documentation](https://docs.livekit.io/agents/)
- [LiveKit Cloud Deployment Guide](https://docs.livekit.io/deploy/agents/cloud/)
- [Environment Variables Reference](./ENV_VARIABLES.md)
