"""
LiveKit Agent for Hedra Avatar Integration

This agent automatically joins LiveKit rooms and starts Hedra avatar sessions
when participants connect.

Setup:
1. Install dependencies: pip install -r agents/requirements.txt
2. Set environment variables (see agents/.env.example)
3. Run: python agents/hedra_agent.py dev

Environment Variables Required:
- LIVEKIT_URL: Your LiveKit server URL (e.g., wss://your-project.livekit.cloud)
- LIVEKIT_API_KEY: Your LiveKit API key
- LIVEKIT_API_SECRET: Your LiveKit API secret
- HEDRA_API_KEY: Your Hedra API key
- HEDRA_AVATAR_ID: Optional - default avatar ID (can be overridden per room)
"""

import os
import re
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentServer, JobContext
from livekit.plugins import hedra

# Load environment variables from root .env file
# This allows the agent to use the same env vars as the Next.js app
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"Loaded environment variables from: {env_path}")
else:
    # Fallback to current directory
    load_dotenv()
    print("Loaded environment variables from current directory")

# Map NEXT_PUBLIC_LIVEKIT_URL to LIVEKIT_URL if needed
# (Next.js uses NEXT_PUBLIC_ prefix for client-side vars)
if not os.getenv("LIVEKIT_URL") and os.getenv("NEXT_PUBLIC_LIVEKIT_URL"):
    os.environ["LIVEKIT_URL"] = os.getenv("NEXT_PUBLIC_LIVEKIT_URL")
    print(f"Mapped NEXT_PUBLIC_LIVEKIT_URL to LIVEKIT_URL: {os.getenv('LIVEKIT_URL')}")

server = AgentServer()


def is_valid_uuid(uuid_string: str) -> bool:
    """Check if a string is a valid UUID format"""
    # UUID pattern: 8-4-4-4-12 hexadecimal digits
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(uuid_string))


@server.rtc_session()
async def hedra_avatar_session(ctx: agents.JobContext):
    """Handle RTC session - called when agent joins a room"""
    
    # Get avatar ID from room metadata or environment
    # Room metadata can be set when creating the room
    avatar_id = ctx.room.metadata or os.getenv("HEDRA_AVATAR_ID")
    
    if not avatar_id:
        print(f"Warning: No avatar ID found for room {ctx.room.name}")
        print("Set HEDRA_AVATAR_ID environment variable or pass via room metadata")
        return
    
    # Validate avatar ID format - Hedra requires UUID format
    # Avatar IDs must be pre-created in Hedra Studio and provided as UUID
    if not is_valid_uuid(avatar_id):
        print(f"ERROR: Invalid avatar ID format for room {ctx.room.name}")
        print(f"Avatar ID: {avatar_id}")
        print("")
        if avatar_id and avatar_id.startswith("local-avatar-"):
            print("⚠️  Detected old 'local-avatar-...' format - this is not a valid UUID!")
            print("")
            print("The upload API is no longer used. Avatars must be pre-created in Hedra Studio.")
            print("")
        print("Hedra requires avatar IDs to be in UUID format:")
        print("  Example: 123e4567-e89b-12d3-a456-426614174000")
        print("")
        print("How to fix:")
        print("1. Create an avatar in Hedra Studio (https://studio.hedra.com)")
        print("2. Get the avatar UUID from Hedra Studio")
        print("3. Set HEDRA_AVATAR_ID in your .env file with the UUID:")
        print("   HEDRA_AVATAR_ID=your-actual-uuid-here")
        print("")
        print("Current value is invalid and will not work with Hedra API.")
        return
    
    print(f"Starting Hedra avatar session for room: {ctx.room.name}")
    print(f"Using avatar ID: {avatar_id}")
    
    try:
        # Connect to the room first - this establishes the RTC connection
        await ctx.connect()
        print(f"Connected to room: {ctx.room.name}")
        
        # Create agent session - required for Hedra avatar
        session = agents.AgentSession()
        
        # Create Hedra avatar session
        avatar = hedra.AvatarSession(avatar_id=avatar_id)
        
        # Start the avatar session - this will publish video/audio tracks to the room
        # The avatar.start() method handles publishing tracks to the room
        await avatar.start(session, room=ctx.room)
        
        # Note: We don't call session.start() here because:
        # 1. The @server.rtc_session() decorator manages the session lifecycle
        # 2. avatar.start() handles publishing tracks to the room
        # 3. The session will remain active as long as the function is running
        
        print(f"Hedra avatar session started successfully for room: {ctx.room.name}")
        
        # Keep the session alive - wait for the room to disconnect
        # Monitor connection state - the function will remain active as long as connected
        while ctx.room.isconnected:
            await asyncio.sleep(1)
        
        print(f"Room disconnected: {ctx.room.name}")
        
    except Exception as e:
        print(f"Error starting Hedra avatar session: {e}")
        raise


if __name__ == "__main__":
    # Run the agent server
    # In dev mode, it will auto-reload on file changes
    # In production, use: python agents/hedra_agent.py start
    agents.cli.run_app(server)

