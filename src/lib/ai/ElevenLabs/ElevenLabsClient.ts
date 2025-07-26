'use client'

import { convertTextToSpeech } from './ElevenLabs'

export async function convertTextToSpeechClient(text: string) {
  try {
    // Call server function
    const result = await convertTextToSpeech(text)

    if (!result.success || !result.audioData) {
      throw new Error('Failed to generate speech')
    }

    // Convert base64 to blob and play
    const binaryString = atob(result.audioData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(audioBlob)

    const audio = new Audio(audioUrl)
    await audio.play()

    // Clean up the URL after playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in convertTextToSpeechClient:', error)
    return { success: false, error }
  }
}
