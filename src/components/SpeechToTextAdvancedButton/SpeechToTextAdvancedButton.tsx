import { Phone } from 'lucide-react'
import styles from './SpeechToTextAdvancedButton.module.scss'
import { useState } from 'react'
import { convertSpeechToText } from '@/lib/ai/ElevenLabs/ElevenLabs'

interface SpeechToTextSimpleButtonProps {
  currentInput: string
  setInput: (input: string) => void
}

export default function SpeechToTextAdvancedButton({
  currentInput,
  setInput,
}: SpeechToTextSimpleButtonProps) {
  const [isListening, setIsListening] = useState(false)
  // const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  // const [isGenerating, setIsGenerating] = useState(false)

  const handleAudioMessage = async () => {
    try {
      const response = await fetch(
        'https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3',
      )
      const audioBlob = new Blob([await response.arrayBuffer()], {
        type: 'audio/mp3',
      })

      // Convert Blob to File for the server action
      const audioFile = new File([audioBlob], 'audio.mp3', {
        type: 'audio/mp3',
      })

      const transcription = await convertSpeechToText(audioFile)
      setInput(transcription.text)
    } catch (error) {
      console.error('Error transcribing audio:', error)
    }
  }

  return (
    <button
      className={`${styles.button} ${isListening ? styles.buttonOn : ''}`}
      onClick={handleAudioMessage}
      title={isListening ? 'Stop listening' : 'Start voice input'}>
      <Phone size={18} />
    </button>
  )
}
