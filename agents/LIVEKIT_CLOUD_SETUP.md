# LiveKit Cloud Setup Summary

All files have been prepared for deploying the Hedra agent to LiveKit Cloud.

## 📁 Files Created

### 1. `agents/Dockerfile`
- Python 3.11 slim base image (glibc-based, required by LiveKit Cloud)
- Non-privileged user for security
- Optimized layer caching
- Ready for LiveKit Cloud deployment

### 2. `livekit.toml` (project root)
- Agent configuration file
- Agent name: `hedra-agent`
- Optional region and resource settings

### 3. `agents/.dockerignore`
- Optimizes Docker build by excluding unnecessary files
- Reduces build time and image size

### 4. `agents/DEPLOYMENT.md`
- Quick deployment checklist
- Step-by-step instructions
- Troubleshooting guide

### 5. Updated `agents/README.md`
- Comprehensive LiveKit Cloud deployment guide
- Alternative deployment options
- Troubleshooting section

## 🚀 Quick Start

1. **Install LiveKit CLI:**
   ```bash
   # macOS
   brew install livekit-cli
   
   # Linux
   curl -sSL https://get.livekit.io/cli | bash
   
   # Windows
   winget install LiveKit.LiveKitCLI
   ```

2. **Authenticate with LiveKit Cloud:**
   ```bash
   lk cloud auth
   ```
   This opens your browser where you can sign in with Google or other social login methods.

3. **Set secrets:**
   ```bash
   lk agent secrets set HEDRA_API_KEY="your-key"
   lk agent secrets set HEDRA_AVATAR_ID="your-uuid"
   lk agent secrets set OPENAI_API_KEY="your-key"
   lk agent secrets set DEEPGRAM_API_KEY="your-key"
   lk agent secrets set ELEVEN_API_KEY="your-key"
   ```

4. **Deploy:**
   ```bash
   lk agent deploy agents/
   ```

5. **Monitor:**
   ```bash
   lk agent status
   lk agent logs
   ```

## ✅ What's Configured

- ✅ Dockerfile optimized for LiveKit Cloud
- ✅ Non-root user for security
- ✅ Proper Python environment setup
- ✅ Environment variable handling (works with LiveKit Cloud secrets)
- ✅ Build optimization with .dockerignore

## 📝 Notes

- **LiveKit credentials are auto-injected** - You don't need to set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, or `LIVEKIT_API_SECRET`
- **Secrets management** - All API keys should be set via `lk agent secrets set`
- **Build context** - When deploying with `lk agent deploy agents/`, the build context is the `agents/` directory
- **Updates** - Simply run `lk agent deploy agents/` again after code changes

## 🔗 Resources

- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- [LiveKit Agent Documentation](https://docs.livekit.io/agents/)
- [LiveKit Cloud Deployment Guide](https://docs.livekit.io/deploy/agents/cloud/)
