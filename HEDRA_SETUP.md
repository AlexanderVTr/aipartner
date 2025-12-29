# Hedra Livestream Avatar Setup

This document explains how to set up and use the Hedra livestream avatar functionality in the application.

## Overview

The HedraVideoCallButton provides two modes of operation:

1. **Pre-configured Avatar**: Uses an avatar ID set via environment variables
2. **Image Upload**: Allows users to upload their own images to create custom avatars

## Environment Variables

Add the following to your `.env` file:

```bash
# Required for both modes
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
HEDRA_API_KEY=your-hedra-api-key

# Optional - for pre-configured avatars
HEDRA_AVATAR_ID=your-avatar-id-from-hedra-studio
```

## How It Works

### Mode 1: Pre-configured Avatar

- Set `HEDRA_AVATAR_ID` in your environment
- Click the video call button
- Connects directly to LiveKit room with your avatar

### Mode 2: Image Upload

- Leave `HEDRA_AVATAR_ID` empty
- Click video call button → Upload modal appears
- Select and upload an image (max 10MB)
- Avatar ID is stored locally for the session
- Connects to LiveKit room

## API Endpoints

### `/api/hedra/token`

- Generates LiveKit access tokens
- Returns: `{ token: string, roomName: string }`

### `/api/hedra/room`

- Creates LiveKit rooms
- Returns: `{ roomName: string, roomUrl: string }`

### `/api/hedra/upload`

- Uploads images to Hedra (currently using local fallback)
- Accepts: `multipart/form-data` with `avatar` file
- Returns: `{ avatarId: string, url?: string, message: string }`
- **Note**: Currently returns mock responses for UI testing. Uncomment the Hedra API code in the route when ready to integrate.

## Server-Side Setup

For production use, you need a LiveKit server running with Hedra agents. The current implementation assumes:

1. LiveKit server is running and accessible
2. Hedra agents are configured and running on the server
3. Avatar sessions are managed server-side

## Current Limitations

1. **Server Integration**: The Hedra avatar sessions need to be started server-side via LiveKit agents
2. **API Integration**: The image upload endpoint needs proper Hedra API integration
3. **Real-time Sync**: Avatar responses depend on proper LiveKit room management

## Testing

To test the UI without full server setup:

1. Set dummy environment variables
2. The upload modal will appear (Mode 2)
3. Image selection and preview work
4. Connection flow can be tested (will fail gracefully without real servers)

## Next Steps

1. **Set up LiveKit server** with Hedra agents
2. **Implement proper Hedra API calls** in upload endpoint
3. **Configure avatar sessions** on the server side
4. **Test end-to-end** with real Hedra avatars

## Files Modified

- `src/components/HedraVideoCallButton/HedraVideoCallButton.tsx` - Main component
- `src/lib/ai/Hedra/avatarConfig.ts` - Configuration
- `src/lib/ai/Hedra/getToken.ts` - Token management
- `src/app/api/hedra/token/route.ts` - Token API
- `src/app/api/hedra/room/route.ts` - Room API
- `src/app/api/hedra/upload/route.ts` - Upload API
- `src/components/Chat/Chat.tsx` - Integration

The implementation is now complete and ready for server-side integration!
