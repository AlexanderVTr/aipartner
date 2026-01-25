# LiveKit Cloud Deployment Checklist

Quick reference guide for deploying the Hedra agent to LiveKit Cloud.

## ✅ Pre-Deployment Checklist

- [ ] LiveKit Cloud account created
- [ ] LiveKit CLI installed (`brew install livekit-cli`)
- [ ] Authenticated with LiveKit Cloud (`lk cloud auth`)
- [ ] All API keys ready:
  - [ ] HEDRA_API_KEY
  - [ ] HEDRA_AVATAR_ID (UUID from Hedra Studio)
  - [ ] OPENAI_API_KEY (or OPENROUTER_API_KEY)
  - [ ] DEEPGRAM_API_KEY
  - [ ] ELEVEN_API_KEY
  - [ ] ELEVENLABS_VOICE_ID (optional)

## 🚀 Deployment Steps

### 1. Set Secrets

```bash
lk agent secrets set HEDRA_API_KEY="your-key"
lk agent secrets set HEDRA_AVATAR_ID="your-uuid"
lk agent secrets set OPENAI_API_KEY="your-key"
lk agent secrets set DEEPGRAM_API_KEY="your-key"
lk agent secrets set ELEVEN_API_KEY="your-key"
```

**Note:** `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are automatically injected - don't set them!

### 2. Deploy Agent

```bash
# From project root
lk agent deploy agents/
```

### 3. Verify Deployment

```bash
# Check status
lk agent status

# View logs
lk agent logs

# Follow logs in real-time
lk agent logs --follow
```

## 🔄 Updating the Agent

After making code changes:

```bash
# Simply redeploy
lk agent deploy agents/
```

## 📊 Monitoring

- **Dashboard:** [cloud.livekit.io](https://cloud.livekit.io)
- **Logs:** `lk agent logs`
- **Status:** `lk agent status`

## 🐛 Common Issues

### Build Fails
- Check `agents/Dockerfile` exists
- Verify `requirements.txt` is valid
- Build timeout is 10 minutes

### Agent Not Connecting
- Verify secrets: `lk agent secrets list`
- Check logs: `lk agent logs`
- Ensure project is active in dashboard

### Avatar Not Responding
- Verify `HEDRA_AVATAR_ID` is valid UUID
- Check all AI service keys are set
- Review logs for API errors

## 📚 Resources

- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- [LiveKit Agent Docs](https://docs.livekit.io/agents/)
- [LiveKit Cloud Deployment Guide](https://docs.livekit.io/deploy/agents/cloud/)
