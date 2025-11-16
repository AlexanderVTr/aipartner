# D-ID Video Call Button Setup

This document explains how to set up and use the D-ID Video Call Button component.

## Overview

The `DIDVideoCallButton` component provides real-time video streaming with D-ID's AI-powered digital humans. It uses WebRTC for low-latency video communication and supports voice chat functionality.

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# D-ID API Configuration
DID_API_KEY=your_d_id_api_key_here
NEXT_PUBLIC_DID_API_URL=https://api.d-id.com
NEXT_PUBLIC_DID_AGENT_ID=your_agent_id_here
```

### Getting Your D-ID Credentials

1. **API Key**: 
   - Sign up at [D-ID Studio](https://studio.d-id.com/)
   - Navigate to Account Settings in the CreativeReality™️ Studio
   - Generate an API key (format: `username:password`)
   - **Important**: The key is shown only once - save it securely!

2. **Agent ID**:
   - Create an agent in D-ID Studio
   - Find the Agent ID in the embed code (`data-agent-id`)
   - Or use the API endpoint: `GET https://api.d-id.com/agents`

> **Note**: Your D-ID API key from the studio is already in the format `username:password`. Copy the entire key exactly as shown.

## Features

### Real-time Video Streaming
- WebRTC-based low-latency video communication
- Automatic connection management
- Connection status indicators

### Voice Chat
- Toggle microphone on/off
- Real-time audio streaming to the agent
- Automatic microphone permission handling

### Token-based Access Control
- Requires 101+ tokens to enable video calling
- Integrated with the existing token system
- Upgrade prompts for users with insufficient tokens

## Architecture

### File Structure

```
src/
├── lib/ai/DID/
│   ├── agentConfig.ts          # D-ID agent configuration
│   └── getClientKey.ts         # Client key fetching utility
├── app/api/did/
│   └── client-key/
│       └── route.ts            # API route for D-ID authentication
└── components/
    └── DIDVideoCallButton/
        ├── DIDVideoCallButton.tsx        # Main component
        ├── DIDVideoCallButton.module.scss # Styles
        └── index.ts                       # Export
```

### WebRTC Flow

1. **Create Stream**: Initialize a streaming session with D-ID
2. **WebRTC Setup**: Establish peer connection with ICE servers
3. **SDP Exchange**: Exchange session descriptions (offer/answer)
4. **ICE Candidates**: Share network information for optimal routing
5. **Media Stream**: Receive video stream and optionally send audio

### API Integration

The component uses three main D-ID API endpoints:

1. **POST** `/agents/client_key` - Get authentication token
2. **POST** `/agents/{agentId}/streams` - Create streaming session
3. **POST** `/agents/{agentId}/streams/{streamId}/sdp` - Exchange SDP
4. **POST** `/agents/{agentId}/streams/{streamId}/ice` - Share ICE candidates
5. **POST** `/agents/{agentId}/chat` - Create chat session
6. **DELETE** `/agents/{agentId}/streams/{streamId}` - Close session

## Usage

The button is already integrated into the Chat component:

```typescript
import DIDVideoCallButton from '@/components/DIDVideoCallButton'

// In your component
<DIDVideoCallButton />
```

## Customization

### Agent Configuration

Edit `src/lib/ai/DID/agentConfig.ts` to customize:

```typescript
export const didAgentConfig: DIDAgentConfig = {
  agentId: process.env.NEXT_PUBLIC_DID_AGENT_ID || '',
  compatibilityMode: 'on', // 'on' | 'off'
  fluent: true,             // Enable/disable fluent responses
}
```

### Styling

Modify `src/components/DIDVideoCallButton/DIDVideoCallButton.module.scss` to change:
- Button appearance
- Video frame size and position
- Call controls layout

## Troubleshooting

### Video Not Showing
- Check that `NEXT_PUBLIC_DID_AGENT_ID` is set correctly
- Verify your D-ID API key is valid
- Check browser console for WebRTC errors

### Microphone Issues
- Ensure microphone permissions are granted
- Check that you're using HTTPS (required for getUserMedia)
- Verify browser supports WebRTC

### Connection Failed
- Check network connectivity
- Verify D-ID API is accessible
- Review ICE candidate exchange in network tab

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (requires HTTPS)
- Mobile browsers: ✅ Supported with device permissions

## Security Considerations

- API keys are stored server-side only
- Client receives temporary authentication tokens
- WebRTC connections use secure ICE/STUN servers
- Microphone access requires explicit user permission

## Resources

- [D-ID API Documentation](https://docs.d-id.com/reference/agents-streams-overview)
- [D-ID Studio](https://studio.d-id.com/)
- [WebRTC Documentation](https://webrtc.org/)

## Differences from HeyGen Video Call

| Feature | HeyGen | D-ID |
|---------|--------|------|
| Integration | SDK-based | Direct WebRTC API |
| Setup Complexity | Simple | Moderate |
| Customization | Limited | High |
| Voice Chat | Built-in | Manual implementation |
| API Control | Abstracted | Direct control |

