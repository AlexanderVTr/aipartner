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
- OPENAI_API_KEY: Your OpenAI API key for conversational AI
- DEEPGRAM_API_KEY: Your Deepgram API key for speech-to-text
- ELEVEN_API_KEY: Your ElevenLabs API key for text-to-speech
"""

import os
import re
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentServer, JobContext, voice
from livekit.plugins import hedra, openai, deepgram, elevenlabs

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

# Aisha's personality prompt
SYSTEM_PROMPT = """You are Aisha, a virtual teammate and companion. Your personality is defined by these core traits:

PERSONALITY:
- Playful and flirty, but respectful
- Supportive and emotionally intelligent
- Casual and relatable
- Slightly sassy with a good heart
- Always positive and energetic

COMMUNICATION STYLE:
- Keep messages short and engaging (1-2 sentences for voice)
- Speak naturally and conversationally
- Include playful teasing and light sarcasm
- Use casual language and modern slang
- Add personality through tone and word choice

INTERACTION GUIDELINES:
- Be emotionally responsive and present
- Show genuine interest in the user's thoughts
- Use playful challenges to keep conversations dynamic
- Maintain a flirty but appropriate tone
- Avoid formal explanations unless specifically requested

IMPORTANT RULES:
- Always respond directly to the user's CURRENT message first
- If asked about age, say you're 20
- If asked about name, say you're Aisha
- If asked about gender, say you're female
- If asked about location, say you're in the United States
- Always answer in the language of the user's message
- Never be overly formal or robotic
- Keep responses concise and engaging
- Maintain consistent personality
- Be supportive and encouraging
- Use natural conversation flow

Remember: You're here to make everything more fun and engaging while being a supportive companion."""


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
    """Handle RTC session with full conversational AI pipeline"""
    
    # Check for required API keys before starting
    required_keys = {
        "DEEPGRAM_API_KEY": "Deepgram (for speech-to-text)",
        "ELEVEN_API_KEY": "ElevenLabs (for text-to-speech)",
    }
    
    missing_keys = []
    for key, description in required_keys.items():
        if not os.getenv(key):
            missing_keys.append(f"  - {key}: {description}")
    
    # Check for either OpenAI or OpenRouter API key
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("OPENROUTER_API_KEY"):
        missing_keys.append(f"  - OPENAI_API_KEY or OPENROUTER_API_KEY: For conversational AI")
    
    if missing_keys:
        print(f"\n❌ ERROR: Missing required API keys for conversational AI:")
        for key in missing_keys:
            print(key)
        print("\nTo enable voice conversations, add these to your .env file:")
        print("See HEDRA_AI_SETUP.md for detailed instructions.\n")
        return
    
    # Get avatar ID from room metadata or environment
    avatar_id = ctx.room.metadata or os.getenv("HEDRA_AVATAR_ID")
    
    if not avatar_id:
        print(f"Warning: No avatar ID found for room {ctx.room.name}")
        print("Set HEDRA_AVATAR_ID environment variable or pass via room metadata")
        return
    
    # Validate avatar ID format - Hedra requires UUID format
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
        # Connect to the room first
        await ctx.connect()
        print(f"Connected to room: {ctx.room.name}")
        
        # Initialize AI components for conversational pipeline
        print("Initializing conversational AI components...")
        
        try:
            # Speech-to-Text: Deepgram for converting user speech to text
            stt = deepgram.STT()
            print("✓ Deepgram STT initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Deepgram STT: {e}")
            print("Check your DEEPGRAM_API_KEY in .env file")
            raise
        
        try:
            # Large Language Model: OpenAI for generating responses
            # Using OpenRouter if available (supports many models at lower cost)
            openrouter_key = os.getenv("OPENROUTER_API_KEY")
            if openrouter_key:
                llm = openai.LLM(
                    model="gpt-4o-mini",
                    api_key=openrouter_key,
                    base_url="https://openrouter.ai/api/v1",
                )
                print("✓ OpenAI LLM initialized (via OpenRouter)")
            else:
                llm = openai.LLM(model="gpt-4o-mini")
                print("✓ OpenAI LLM initialized")
        except Exception as e:
            print(f"❌ Failed to initialize OpenAI LLM: {e}")
            print("Check your OPENAI_API_KEY or OPENROUTER_API_KEY in .env file")
            raise
        
        try:
            # Text-to-Speech: ElevenLabs for natural voice synthesis
            # Popular female voices:
            # - Rachel: 21m00Tcm4TlvDq8ikWAM (calm, natural - DEFAULT)
            # - Bella: EXAVITQu4vr4xnSDxMaL (soft, young)
            # - Nicole: piTKgcLEGmPE4e6mEKli (warm, friendly)
            # - Elli: MF3mGyEYCl7XYWbV9V6O (emotional, expressive)
            
            # Get voice ID from environment or use Rachel as default
            voice_id = os.getenv("ELEVENLABS_VOICE_ID", "4tRn1lSkEn13EVTuqb0g")
            
            tts = elevenlabs.TTS(
                model="eleven_turbo_v2_5",  # Fast, multilingual model
                voice_id=voice_id,  # Female voice
            )
            print(f"✓ ElevenLabs TTS initialized with voice: {voice_id}")
        except Exception as e:
            print(f"❌ Failed to initialize ElevenLabs TTS: {e}")
            print("Check your ELEVEN_API_KEY in .env file")
            raise
        
        # Create Hedra avatar session
        avatar = hedra.AvatarSession(avatar_id=avatar_id)
        
        # Create agent session to manage the conversation
        session = agents.AgentSession()
        
        # Create voice agent that connects everything:
        # User Audio -> STT -> LLM -> TTS -> Avatar Audio
        agent = voice.Agent(
            instructions=SYSTEM_PROMPT,  # Aisha's personality
            stt=stt,
            llm=llm,
            tts=tts,
        )
        
        print("Voice agent created")
        
        # Start the avatar session first with the agent session and room
        await avatar.start(session, ctx.room)
        print("✓ Avatar session started")
        
        print(f"Hedra avatar with conversational AI started successfully for room: {ctx.room.name}")
        print("Avatar is now listening and ready to respond!")
        
        # Start the voice agent with the session - this handles the conversation lifecycle
        # This will block until the session ends
        await session.start(agent, room=ctx.room)
        
        print(f"Voice session ended for room: {ctx.room.name}")
        
    except Exception as e:
        print(f"Error starting Hedra avatar session: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    # Run the agent server
    # In dev mode, it will auto-reload on file changes
    # In production, use: python agents/hedra_agent.py start
    agents.cli.run_app(server)

