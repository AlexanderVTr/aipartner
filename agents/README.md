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

For production, run the agent as a service:

```bash
# Using systemd (Linux)
sudo systemctl enable hedra-agent
sudo systemctl start hedra-agent

# Using Docker
docker build -t hedra-agent .
docker run -d --env-file .env hedra-agent
```

