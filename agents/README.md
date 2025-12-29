# Hedra LiveKit Agent

This agent service automatically joins LiveKit rooms and starts Hedra avatar sessions when participants connect.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r agents/requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export LIVEKIT_URL="wss://your-project.livekit.cloud"
   export LIVEKIT_API_KEY="your-api-key"
   export LIVEKIT_API_SECRET="your-api-secret"
   export HEDRA_API_KEY="your-hedra-api-key"
   export HEDRA_AVATAR_ID="your-avatar-id"  # Optional
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
3. Agent starts Hedra avatar session with the configured avatar ID
4. Avatar publishes video/audio tracks to the room
5. Client receives tracks and displays video

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

