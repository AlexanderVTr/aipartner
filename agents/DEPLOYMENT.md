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
  - [ ] CARTESIA_API_KEY
  - [ ] CARTESIA_MODEL (optional)
  - [ ] CARTESIA_VOICE_ID (optional)
  - [ ] CARTESIA_LANGUAGE (optional)

## 🚀 Deployment Steps

### 1. Set Secrets

```bash
lk agent secrets set HEDRA_API_KEY="your-key"
lk agent secrets set HEDRA_AVATAR_ID="your-uuid"
lk agent secrets set OPENAI_API_KEY="your-key"
lk agent secrets set DEEPGRAM_API_KEY="your-key"
lk agent secrets set CARTESIA_API_KEY="your-key"
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

### Audio Not Working / TTS Issues

**1. Verify API Key is Set:**

```bash
# Check if secret exists
lk agent secrets list | grep CARTESIA_API_KEY

# View logs to see if key is detected
lk agent logs | grep "CARTESIA_API_KEY"
```

If logs show "⚠️ WARNING: CARTESIA_API_KEY not found", set it:

```bash
lk agent secrets set CARTESIA_API_KEY="your-actual-key"
lk agent deploy agents/
```

**2. Verify API Key is Valid:**

- Get your API key from: https://play.cartesia.ai/keys
- Ensure the key has sufficient quota/credits
- Verify the key hasn't expired

**3. Check Model and Voice Configuration:**

- Default model: `sonic-3`
- Default voice ID: `794f9389-aac1-45b6-b726-9d9369183238`
- Browse available voices at: https://play.cartesia.ai/
- Try a different voice ID if needed

**4. Model Options:**

- `sonic-3` - Default, high quality
- `sonic-english` - English optimized
- `sonic-multilingual` - Multilingual support
- Set via: `lk agent secrets set CARTESIA_MODEL="sonic-3"`

**5. Language Configuration:**

- Default language: `en` (English)
- Format: ISO-639-1 language code (e.g., `en`, `es`, `fr`)
- Set via: `lk agent secrets set CARTESIA_LANGUAGE="en"`

**6. Network/Connectivity:**

- Cloud agent needs outbound internet access to Cartesia API
- Verify no firewall blocking outbound HTTPS
- Check Cartesia API status if issues persist

**7. Check Logs for Details:**

```bash
# Follow logs in real-time
lk agent logs --follow

# Look for these messages:
# - "✓ Cartesia TTS initialized" = TTS is working
# - "❌ Failed to initialize Cartesia TTS" = Configuration issue
# - Check error messages for specific API errors
```

**Quick Diagnostic Steps:**

1. Check logs: `lk agent logs | grep -i "cartesia"`
2. Verify secret: `lk agent secrets list`
3. Test with a known-good API key
4. Verify model and voice IDs are correct
5. Check Cartesia dashboard for API usage/errors

## 📚 Resources

- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- [LiveKit Agent Docs](https://docs.livekit.io/agents/)
- [LiveKit Cloud Deployment Guide](https://docs.livekit.io/deploy/agents/cloud/)
