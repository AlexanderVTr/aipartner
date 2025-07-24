import { Mic } from 'lucide-react'
import { useState } from 'react'
import styles from './SpeechToTextSimpleButton.module.scss'

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
        confidence: number
      }
      isFinal: boolean
      length: number
    }
    length: number
  }
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechToTextSimpleButtonProps {
  currentInput: string
  setInput: (input: string) => void
}

export default function SpeechToTextSimpleButton({
  currentInput,
  setInput,
}: SpeechToTextSimpleButtonProps) {
  const [isSpeeking, setIsSpeeking] = useState(false)

  const handleAudioMessage = () => {
    // Firefox/Opera not supported
    if (!window || !('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not available')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      alert('Speech recognition error: ' + event.error)
      setIsSpeeking(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setInput(currentInput + ' ' + transcript)
    }

    let timeoutId: NodeJS.Timeout
    recognition.onspeechstart = () => {
      setIsSpeeking(true)
      clearTimeout(timeoutId)
    }

    recognition.onspeechend = () => {
      timeoutId = setTimeout(() => {
        recognition.stop()
        setIsSpeeking(false)
      }, 2000)
    }

    recognition.start()
  }

  return (
    <button
      className={`${styles.button} ${isSpeeking ? styles.buttonOn : ''}`}
      onClick={handleAudioMessage}
      disabled={isSpeeking}>
      <Mic size={18} />
    </button>
  )
}
