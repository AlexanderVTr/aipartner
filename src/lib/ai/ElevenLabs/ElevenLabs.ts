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
    tagAudioEvents: false, // Tag audio events like laughter, applause, etc.
    languageCode: undefined,
    diarize: false, // Whether to annotate who is speaking, if few users speaking at once
  })

  //TODO: Add emotionalResponses and other options BASED ON tagAudioEvents

  return transcription
}

export async function convertTextToSpeechDirect(text: string) {
  try {
    const client = await elevenLabs()

    const audio = await client.textToSpeech.convert('gedzfqL7OGdPbwm0ynTP', {
      text: text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    })

    // Convert to ArrayBuffer
    const chunks = []
    const reader = audio.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const audioBuffer = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0),
    )

    let offset = 0
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset)
      offset += chunk.length
    }

    // Return as base64 for direct use
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return { success: true, audioData: base64Audio }
  } catch (error) {
    console.error('Error in convertTextToSpeechDirect:', error)
    return { success: false, error }
  }
}
