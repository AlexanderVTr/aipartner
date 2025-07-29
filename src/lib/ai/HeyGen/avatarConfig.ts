import {
  AvatarQuality,
  ElevenLabsModel,
  StartAvatarRequest,
  STTProvider,
  VoiceChatTransport,
  VoiceEmotion,
} from '@heygen/streaming-avatar'

export const avatarConfig: StartAvatarRequest = {
  quality: AvatarQuality.Low,
  avatarName: 'Ann_Therapist_public', // Avatar ID
  voice: {
    rate: 1.0,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  //TODO: Add languages here
  language: 'en',
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
}
