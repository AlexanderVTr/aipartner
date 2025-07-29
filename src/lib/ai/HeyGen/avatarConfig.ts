import {
  AvatarQuality,
  ElevenLabsModel,
  StartAvatarRequest,
  STTProvider,
  VoiceChatTransport,
  VoiceEmotion,
} from '@heygen/streaming-avatar'
import { SYSTEM_PROMPT } from '@/lib/ai/prompt'

export const avatarConfig: StartAvatarRequest = {
  quality: AvatarQuality.High,
  avatarName: 'Elenora_FitnessCoach_public', // Avatar ID
  voice: {
    rate: 1.0,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_multilingual_v2,
  },
  //TODO: It's may be will be better if user can select language can be ''-auto detect
  language: '',
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
  // Add Aisha's personality and knowledge
  knowledgeBase: SYSTEM_PROMPT,
}
