# Hedra LiveKit Agent with Conversational AI

This agent service automatically joins LiveKit rooms and starts Hedra avatar sessions with full conversational AI capabilities when participants connect.

## Features

- **Hedra Avatar**: Live avatar video streaming
- **Speech-to-Text**: Deepgram for voice recognition
- **AI Responses**: OpenAI GPT for intelligent conversations
- **Text-to-Speech**: ElevenLabs for natural voice synthesis
- **Voice Activity Detection**: Automatic turn-taking

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r agents/requirements.txt
   ```

2. **Set environment variables:**
   
   Add these to your `.env` file in the project root:
   
   ```bash
   # LiveKit Configuration
   LIVEKIT_URL="wss://your-project.livekit.cloud"
   LIVEKIT_API_KEY="your-livekit-api-key"
   LIVEKIT_API_SECRET="your-livekit-api-secret"
   
   # Hedra Avatar
   HEDRA_API_KEY="your-hedra-api-key"
   HEDRA_AVATAR_ID="your-avatar-uuid"  # Get from Hedra Studio
   
   # AI Services
   OPENAI_API_KEY="your-openai-api-key"      # For conversational AI
   DEEPGRAM_API_KEY="your-deepgram-api-key"  # For speech-to-text
   ELEVEN_API_KEY="your-elevenlabs-api-key"  # For text-to-speech
   ```

3. **Run the agent:**
   ```bash
   # Development mode (with auto-reload)
   python agents/hedra_agent.py dev
   
   # Production mode
   python agents/hedra_agent.py start
   ```

## How It Works

1. Agent connects to LiveKit server
2. When a participant joins a room, the agent automatically joins
3. Agent initializes the conversational AI pipeline:
   - Deepgram STT listens to user's voice
   - OpenAI GPT generates intelligent responses
   - ElevenLabs TTS synthesizes speech
   - Hedra avatar lip-syncs and displays video
4. User can have natural conversations with the avatar

## Configuration

- **Auto-join**: The agent automatically joins rooms when participants connect
- **Avatar ID**: Can be set via:
  - Room metadata (passed from client)
  - `HEDRA_AVATAR_ID` environment variable
  - Default fallback

## Deployment

### 🚀 LiveKit Cloud (Recommended)

**LiveKit Cloud is the official platform for deploying LiveKit agents. It's the easiest and most reliable option with zero infrastructure management.**

#### Prerequisites

1. **Install LiveKit CLI:**
   ```bash
   # macOS
   brew install livekit-cli
   
   # Linux
   curl -sSL https://get.livekit.io/cli | bash
   
   # Windows
   winget install LiveKit.LiveKitCLI
   
   # Or download from: https://github.com/livekit/livekit-cli/releases
   ```

2. **Authenticate with LiveKit Cloud:**
   ```bash
   lk cloud auth
   ```
   This will open your browser where you can sign in with Google (or other social login methods). After authentication, the CLI will be linked to your LiveKit Cloud account.

3. **Create a LiveKit Cloud project** (if you haven't already):
   - Go to [cloud.livekit.io](https://cloud.livekit.io)
   - Create a new project or select an existing one
   - Note your project ID (you'll see it in the dashboard)

#### Deploy to LiveKit Cloud

1. **Set secrets in LiveKit Cloud:**
   
   All API keys and sensitive data should be set as secrets (not in code):
   
   ```bash
   # Hedra Avatar Configuration
   lk agent secrets set HEDRA_API_KEY="your-hedra-api-key"
   lk agent secrets set HEDRA_AVATAR_ID="your-avatar-uuid"
   
   # AI Services
   lk agent secrets set OPENAI_API_KEY="your-openai-api-key"
   # OR use OpenRouter (cheaper alternative)
   lk agent secrets set OPENROUTER_API_KEY="your-openrouter-api-key"
   
   # Speech-to-Text
   lk agent secrets set DEEPGRAM_API_KEY="your-deepgram-api-key"
   
   # Text-to-Speech
   lk agent secrets set ELEVEN_API_KEY="your-elevenlabs-api-key"
   
   # Optional: Custom ElevenLabs voice ID
   lk agent secrets set ELEVENLABS_VOICE_ID="your-voice-id"
   ```
   
   **Important:** `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are **automatically injected** by LiveKit Cloud - you don't need to set them!

2. **Deploy the agent:**
   
   From the project root directory:
   ```bash
   lk agent deploy agents/
   ```
   
   Or create a new agent (first time):
   ```bash
   lk agent create agents/
   ```
   
   The CLI will:
   - Build a Docker image from `agents/Dockerfile`
   - Upload the build context
   - Deploy to LiveKit Cloud
   - Stream build logs to your terminal

3. **Check agent status:**
   ```bash
   lk agent status
   ```

4. **View logs:**
   ```bash
   # Real-time logs
   lk agent logs
   
   # Follow logs (like tail -f)
   lk agent logs --follow
   ```

5. **Update the agent:**
   
   After making code changes, redeploy:
   ```bash
   lk agent deploy agents/
   ```

#### Benefits of LiveKit Cloud

- ✅ **Zero infrastructure management** - LiveKit handles everything
- ✅ **Automatic scaling** - Handles traffic spikes automatically  
- ✅ **Global edge network** - Low latency worldwide
- ✅ **Built-in monitoring** - Analytics and logs in dashboard
- ✅ **99.99% uptime guarantee**
- ✅ **Easy updates** - Deploy new versions with one command
- ✅ **Secure** - Secrets management built-in

#### Troubleshooting LiveKit Cloud Deployment

**Build fails:**
- Check that `agents/Dockerfile` exists and is valid
- Ensure all dependencies in `requirements.txt` are correct
- Build timeout is 10 minutes - optimize if needed

**Agent not connecting:**
- Verify all secrets are set: `lk agent secrets list`
- Check agent logs: `lk agent logs`
- Ensure your LiveKit Cloud project is active

**Avatar not responding:**
- Verify `HEDRA_AVATAR_ID` is a valid UUID from Hedra Studio
- Check that all AI service keys are set correctly
- Review logs for API errors

### Alternative Deployment Options

#### Railway

1. Create `Procfile` in project root:
   ```
   web: python agents/hedra_agent.py start
   ```

2. Deploy to [railway.app](https://railway.app) and add all environment variables

#### Docker (Self-hosted)

```bash
# Build
docker build -f agents/Dockerfile -t hedra-agent .

# Run
docker run -d \
  --env-file .env \
  --name hedra-agent \
  hedra-agent
```

#### Render

Create `render.yaml` in project root and deploy via [render.com](https://render.com)

