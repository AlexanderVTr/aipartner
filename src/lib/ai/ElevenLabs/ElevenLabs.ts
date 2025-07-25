'use server'

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export async function elevenLabs() {
  return new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  })
}

export async function convertSpeechToText(audioFile: File) {
  const client = await elevenLabs()

  const transcription = await client.speechToText.convert({
    file: audioFile,
    modelId: 'scribe_v1',
    tagAudioEvents: true, // Tag audio events like laughter, applause, etc.
    languageCode: undefined,
    diarize: false, // Whether to annotate who is speaking, if few users speaking at once
  })

  //TODO: Add emotionalResponses and other options BASED ON tagAudioEvents

  return transcription
}
