# Hedra Conversational AI Setup

## What Was Fixed

Your Hedra avatar was showing video but not responding to voice because it was **missing the conversational AI pipeline**. The agent now includes:

✅ **Speech-to-Text (Deepgram)** - listens to your voice  
✅ **AI Brain (OpenAI GPT)** - generates intelligent responses  
✅ **Text-to-Speech (ElevenLabs)** - speaks back naturally  
✅ **Voice Activity Detection** - automatic turn-taking

## Required Environment Variables

Add these to your `.env` file in the project root:

```bash
# === LiveKit Configuration (Required) ===
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

# === Hedra Avatar (Required) ===
HEDRA_API_KEY=your-hedra-api-key
HEDRA_AVATAR_ID=b35096b3-1f67-4a2c-aea5-684929ac64be  # Your existing UUID

# === AI Services for Conversation (NEW - Required) ===
OPENAI_API_KEY=your-openai-api-key        # For conversational AI
DEEPGRAM_API_KEY=your-deepgram-api-key    # For speech-to-text
ELEVEN_API_KEY=your-elevenlabs-api-key    # For text-to-speech
```

## Getting API Keys

### 1. OpenAI API Key

- Sign up at: https://platform.openai.com/
- Create API key at: https://platform.openai.com/api-keys
- Add to `.env` as `OPENAI_API_KEY`

### 2. Deepgram API Key

- Sign up at: https://console.deepgram.com/
- Get API key from: https://console.deepgram.com/project/default/keys
- Add to `.env` as `DEEPGRAM_API_KEY`
- Free tier includes: 12,000 minutes/year

### 3. ElevenLabs API Key

- Sign up at: https://elevenlabs.io/
- Get API key from: https://elevenlabs.io/app/settings/api
- Add to `.env` as `ELEVEN_API_KEY`
- Free tier includes: 10,000 characters/month

## Starting the Agent

The agent needs to be running for conversations to work:

```bash
# Make sure you're in the project directory
cd /Users/oleksandrtroshchenko/IdeaProjects/other/aime

# Run the agent in dev mode (auto-reloads on changes)
python agents/hedra_agent.py dev
```

The agent will:

1. ✅ Connect to your LiveKit server
2. ✅ Wait for users to join rooms
3. ✅ Auto-start the conversational AI pipeline
4. ✅ Listen and respond to voice naturally

## Testing the Setup

1. **Start the agent** (see above)
2. **Start your Next.js app** in another terminal:
   ```bash
   npm run dev
   ```
3. **Click the video call button** in your app
4. **Allow microphone access** when prompted
5. **Speak to the avatar** - it should now respond!

## Troubleshooting

### No audio response?

- ✅ Check all 3 AI service API keys are in `.env`
- ✅ Make sure the agent is running (`python agents/hedra_agent.py dev`)
- ✅ Check terminal logs for errors
- ✅ Verify microphone permissions are granted

### Agent crashes on start?

- Check for missing API keys in the terminal output
- Verify all keys are valid and not expired
- Check your API key quotas haven't been exceeded

### Voice not detected?

- Check microphone permissions in browser
- Verify microphone is not muted
- Look for VAD (Voice Activity Detection) logs in terminal

## How It Works

```
User speaks → Deepgram (STT) → OpenAI (LLM) → ElevenLabs (TTS) → Hedra Avatar
     ↑                                                                    ↓
     └─────────────────── Video + Audio Response ──────────────────────┘
```

1. **You speak**: Microphone captures your voice
2. **Deepgram**: Converts speech to text
3. **OpenAI GPT**: Generates intelligent response (as Aisha)
4. **ElevenLabs**: Converts response to natural speech
5. **Hedra Avatar**: Lip-syncs and displays video + audio

## Aisha's Personality

The avatar uses Aisha's personality:

- Playful and flirty, but respectful
- Supportive and emotionally intelligent
- Casual and relatable
- Slightly sassy with a good heart
- Keeps responses short and engaging for voice

## Next Steps

1. Add your API keys to `.env`
2. Restart the agent
3. Test the video call with voice
4. Enjoy natural conversations with your avatar!
