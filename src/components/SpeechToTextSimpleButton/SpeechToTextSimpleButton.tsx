import { Mic } from 'lucide-react'
import { useState } from 'react'
import styles from './SpeechToTextSimpleButton.module.scss'

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
    //Firefox/Opera not supported
    if (!window || !(window as any).webkitSpeechRecognition) {
      alert('Speech recognition is not available')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onerror = (event: any) => {
      alert('Speech recognition error: ' + event.error)
    }

    recognition.onresult = (event: any) => {
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
      onClick={handleAudioMessage}>
      <Mic size={18} />
    </button>
  )
}
