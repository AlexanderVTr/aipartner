'use client'

import { convertTextToSpeechDirect } from './ElevenLabs'

export async function playTextToSpeechDirect(text: string) {
  try {
    // Call server function
    const result = await convertTextToSpeechDirect(text)

    if (!result.success || !result.audioData) {
      throw new Error('Failed to generate speech')
    }

    // Convert base64 to data URL
    const dataUrl = `data:audio/mpeg;base64,${result.audioData}`

    // Use simple HTML5 Audio approach with data URL
    const audio = new Audio()
    audio.src = dataUrl

    // Set audio properties for better playback
    audio.preload = 'auto'
    audio.volume = 1.0

    // Wait for audio to be fully loaded
    await new Promise((resolve, reject) => {
      audio.oncanplaythrough = resolve
      audio.onerror = reject
      audio.load()
    })

    // Play audio
    await audio.play()

    return { success: true }
  } catch (error) {
    console.error('Error in playTextToSpeechDirect:', error)
    return { success: false, error }
  }
}
