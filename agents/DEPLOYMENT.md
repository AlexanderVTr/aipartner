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

### Audio Not Working / "403 Forbidden" or "no audio frames were pushed"

**403 Forbidden Error (NEW):**
If you see `WSServerHandshakeError: 403` in logs, this means ElevenLabs is blocking the cloud agent's IP address. This happens even when local agent works fine.

**Root Cause:** ElevenLabs API may have IP restrictions or rate limiting that blocks cloud infrastructure IPs.

**Solution:**
1. Check ElevenLabs Dashboard → Settings → Security
2. Disable any IP whitelist restrictions (if enabled)
3. Check for rate limiting that might affect cloud IPs
4. Contact ElevenLabs support to whitelist LiveKit Cloud IP ranges

**"no audio frames were pushed" Error:**
This error means ElevenLabs TTS is not generating audio. Check the logs for debug output:

**1. Verify API Key is Set:**
```bash
# Check if secret exists
lk agent secrets list | grep ELEVEN_API_KEY

# View logs to see if key is detected
lk agent logs | grep "ELEVEN_API_KEY"
```

If logs show "⚠️ WARNING: ELEVEN_API_KEY not found", set it:
```bash
lk agent secrets set ELEVEN_API_KEY="your-actual-key"
lk agent deploy agents/
```

**2. Verify API Key is Valid:**
- Check your ElevenLabs account: https://elevenlabs.io/app/settings/api
- Ensure the key has sufficient quota/credits
- Verify the key hasn't expired

**3. Check Voice ID:**
- Default voice ID: `4tRn1lSkEn13EVTuqb0g` (Rachel)
- Verify the voice exists in your ElevenLabs account
- Try a different voice ID if needed

**4. Model Compatibility:**
- Current model: `eleven_turbo_v2_5`
- If issues persist, try `eleven_flash_v2_5` (more stable)
- Edit `hedra_agent.py` line 209 to change model

**5. Region/Latency Issues:**
- **IMPORTANT:** If you're in EU and using US East region, latency can cause "no audio frames" errors
- ElevenLabs servers are optimized for geographic proximity
- **Solution:** Deploy agent to EU region (`eu-central`) instead of US East
  ```bash
  # Delete current agent (if needed)
  lk agent delete
  
  # Create new agent in EU region
  lk agent create --region eu-central agents/
  ```
- Available regions: `us-east` (US East), `eu-central` (Europe - Frankfurt)
- Choose region closest to your users and ElevenLabs servers

**6. Network/Connectivity:**
- Cloud agent needs outbound internet access to ElevenLabs API
- Check ElevenLabs API status: https://status.elevenlabs.io/
- Verify no firewall blocking outbound HTTPS

**7. Cloud WebSocket Streaming Issue (Known Problem):**
- **Symptom:** Works locally but fails in cloud with `"no audio frames were pushed"` and `body=None`
- **Root Cause:** Cloud network/firewall may be blocking WebSocket data flow to ElevenLabs
- **Error Pattern:** `streamed: true` but no audio frames received
- **Solutions:**
  1. **Contact LiveKit Support:** Report cloud WebSocket connectivity issue
     - Include error logs showing `body=None` and `streamed: true`
     - Mention that local works but cloud doesn't
  2. **Contact ElevenLabs Support:** Verify cloud IP restrictions or firewall rules
  3. **Workaround:** Consider using alternative TTS provider (Azure Speech, AWS Polly) that may work better in cloud
  4. **Check Cloud Network Settings:** Verify outbound WebSocket connections are allowed

**8. Check Logs for Details:**
```bash
# Follow logs in real-time
lk agent logs --follow

# Look for these messages:
# - "✓ ELEVEN_API_KEY found" = Key is detected
# - "⚠️ WARNING: ELEVEN_API_KEY not found" = Key missing
# - "no audio frames were pushed" = API call succeeded but no audio returned
# - "streamed: true" + "body=None" = WebSocket connection issue
```

**Quick Diagnostic Steps:**
1. Check logs: `lk agent logs | grep -i "eleven"`
2. Verify secret: `lk agent secrets list`
3. Test with a known-good API key
4. Check ElevenLabs dashboard for API usage/errors
5. If local works but cloud doesn't → Cloud network/WebSocket issue (contact support)

## 📚 Resources

- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- [LiveKit Agent Docs](https://docs.livekit.io/agents/)
- [LiveKit Cloud Deployment Guide](https://docs.livekit.io/deploy/agents/cloud/)
