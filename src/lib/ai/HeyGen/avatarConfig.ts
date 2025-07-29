import {
  AvatarQuality,
  ElevenLabsModel,
  StartAvatarRequest,
  STTProvider,
  VoiceChatTransport,
  VoiceEmotion,
} from '@heygen/streaming-avatar'

export const avatarConfig: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: 'Elenora_FitnessCoach_public', // Avatar ID
  voice: {
    rate: 1.0,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_multilingual_v2,
  },
  //TODO: Add languages here
  language: 'en',
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
}
