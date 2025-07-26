import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

interface ElevenLabsTTSProps {
  text: string
}

export default async function ElevenLabsTTS({ text }: ElevenLabsTTSProps) {
  try {
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })

    const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
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

    // Convert to base64 for embedding in HTML
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`

    return (
      <audio controls autoPlay>
        <source src={dataUrl} type='audio/mpeg' />
        Your browser does not support the audio element.
      </audio>
    )
  } catch (error) {
    console.error('Error in ElevenLabsTTS:', error)
    return <div>Error generating speech</div>
  }
}
