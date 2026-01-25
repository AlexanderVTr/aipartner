# Environment Variables Used by Hedra Agent

Complete list of all environment variables used by the Hedra agent.

## 🔴 Required Environment Variables

### LiveKit Configuration
These are **automatically injected by LiveKit Cloud** - you don't need to set them when deploying to LiveKit Cloud.

- `LIVEKIT_URL` - Your LiveKit server URL (e.g., `wss://your-project.livekit.cloud`)
  - **Note:** Can also use `NEXT_PUBLIC_LIVEKIT_URL` (will be mapped automatically)
  - **LiveKit Cloud:** ✅ Auto-injected
  - **Self-hosted:** Required

- `LIVEKIT_API_KEY` - Your LiveKit API key
  - **LiveKit Cloud:** ✅ Auto-injected
  - **Self-hosted:** Required

- `LIVEKIT_API_SECRET` - Your LiveKit API secret
  - **LiveKit Cloud:** ✅ Auto-injected
  - **Self-hosted:** Required

### Hedra Avatar
- `HEDRA_API_KEY` - Your Hedra API key
  - **Required:** Yes
  - **Set via:** `lk agent secrets set HEDRA_API_KEY="your-key"`

### AI Services (Required - at least one option)

**Option 1: OpenAI**
- `OPENAI_API_KEY` - Your OpenAI API key for conversational AI
  - **Required:** Yes (if not using OpenRouter)
  - **Set via:** `lk agent secrets set OPENAI_API_KEY="your-key"`

**Option 2: OpenRouter (Alternative to OpenAI)**
- `OPENROUTER_API_KEY` - Your OpenRouter API key (supports many models at lower cost)
  - **Required:** Yes (if not using OpenAI)
  - **Set via:** `lk agent secrets set OPENROUTER_API_KEY="your-key"`
  - **Note:** Code checks for either `OPENAI_API_KEY` OR `OPENROUTER_API_KEY`

### Speech-to-Text
- `DEEPGRAM_API_KEY` - Your Deepgram API key for speech-to-text
  - **Required:** Yes
  - **Set via:** `lk agent secrets set DEEPGRAM_API_KEY="your-key"`

### Text-to-Speech
- `ELEVEN_API_KEY` - Your ElevenLabs API key for text-to-speech
  - **Required:** Yes
  - **Set via:** `lk agent secrets set ELEVEN_API_KEY="your-key"`

## 🟡 Optional Environment Variables

### Avatar Configuration
- `HEDRA_AVATAR_ID` - Default avatar UUID (can be overridden per room via metadata)
  - **Required:** No (can be passed via room metadata instead)
  - **Format:** Must be valid UUID (e.g., `123e4567-e89b-12d3-a456-426614174000`)
  - **Set via:** `lk agent secrets set HEDRA_AVATAR_ID="your-uuid"`
  - **Note:** If not set, must be passed via room metadata when creating the room

### Voice Configuration
- `ELEVENLABS_VOICE_ID` - Custom ElevenLabs voice ID
  - **Required:** No
  - **Default:** `"4tRn1lSkEn13EVTuqb0g"` (Rachel voice)
  - **Set via:** `lk agent secrets set ELEVENLABS_VOICE_ID="your-voice-id"`
  - **Popular female voices:**
    - Rachel: `21m00Tcm4TlvDq8ikWAM` (calm, natural)
    - Bella: `EXAVITQu4vr4xnSDxMaL` (soft, young)
    - Nicole: `piTKgcLEGmPE4e6mEKli` (warm, friendly)
    - Elli: `MF3mGyEYCl7XYWbV9V6O` (emotional, expressive)

## 📋 Complete List for LiveKit Cloud Deployment

When deploying to LiveKit Cloud, set these secrets:

```bash
# Required
lk agent secrets set HEDRA_API_KEY="your-hedra-api-key"
lk agent secrets set DEEPGRAM_API_KEY="your-deepgram-api-key"
lk agent secrets set ELEVEN_API_KEY="your-elevenlabs-api-key"

# Required (choose one)
lk agent secrets set OPENAI_API_KEY="your-openai-api-key"
# OR
lk agent secrets set OPENROUTER_API_KEY="your-openrouter-api-key"

# Optional
lk agent secrets set HEDRA_AVATAR_ID="your-avatar-uuid"
lk agent secrets set ELEVENLABS_VOICE_ID="your-voice-id"
```

**Note:** `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are automatically injected by LiveKit Cloud - **do not set them**.

## 📋 Complete List for Local/Self-Hosted Deployment

For local development or self-hosted deployment, add these to your `.env` file:

```bash
# LiveKit Configuration
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"

# Hedra Avatar
HEDRA_API_KEY="your-hedra-api-key"
HEDRA_AVATAR_ID="your-avatar-uuid"  # Optional

# AI Services (choose one)
OPENAI_API_KEY="your-openai-api-key"
# OR
OPENROUTER_API_KEY="your-openrouter-api-key"

# Speech-to-Text
DEEPGRAM_API_KEY="your-deepgram-api-key"

# Text-to-Speech
ELEVEN_API_KEY="your-elevenlabs-api-key"
ELEVENLABS_VOICE_ID="your-voice-id"  # Optional, defaults to Rachel
```

## 🔍 Code References

- **Line 45-46:** `LIVEKIT_URL` / `NEXT_PUBLIC_LIVEKIT_URL` mapping
- **Line 107-108:** `DEEPGRAM_API_KEY`, `ELEVEN_API_KEY` (required check)
- **Line 117:** `OPENAI_API_KEY` or `OPENROUTER_API_KEY` (either required)
- **Line 129:** `HEDRA_AVATAR_ID` (from env or room metadata)
- **Line 181:** `OPENROUTER_API_KEY` (alternative to OpenAI)
- **Line 206:** `ELEVENLABS_VOICE_ID` (optional, has default)
- **Line 219:** `HEDRA_API_KEY` (used by `hedra.AvatarSession`)

## ✅ Validation

The agent validates these on startup:
- ✅ `DEEPGRAM_API_KEY` - Required
- ✅ `ELEVEN_API_KEY` - Required
- ✅ `OPENAI_API_KEY` OR `OPENROUTER_API_KEY` - At least one required
- ✅ `HEDRA_AVATAR_ID` - Required (from env or room metadata)
- ✅ `HEDRA_AVATAR_ID` format - Must be valid UUID
