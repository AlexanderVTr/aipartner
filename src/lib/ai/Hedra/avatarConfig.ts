// Hedra avatar configuration
// Required environment variables:
// - NEXT_PUBLIC_LIVEKIT_URL: Your LiveKit server URL (e.g., wss://your-project.livekit.cloud)
// - LIVEKIT_API_KEY: Your LiveKit API key
// - LIVEKIT_API_SECRET: Your LiveKit API secret
// - HEDRA_API_KEY: Your Hedra API key
//
// Optional: HEDRA_AVATAR_ID (if you have a pre-created avatar from Hedra Studio)
// If not provided, you can upload a local image file

export const hedraConfig = {
  // LiveKit connection details
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
  livekitApiKey: process.env.LIVEKIT_API_KEY,
  livekitApiSecret: process.env.LIVEKIT_API_SECRET,

  // Hedra configuration
  hedraApiKey: process.env.HEDRA_API_KEY,
  hedraAvatarId: process.env.HEDRA_AVATAR_ID, // Optional - can be undefined

  // Avatar settings
  avatarName: 'Hedra Avatar',
  voice: {
    provider: 'elevenlabs', // or other voice provider
    model: 'eleven_multilingual_v2',
    voiceId: 'your-voice-id', // Replace with actual voice ID
  },

  // Language and other settings
  language: 'en',
  quality: 'high',
}
