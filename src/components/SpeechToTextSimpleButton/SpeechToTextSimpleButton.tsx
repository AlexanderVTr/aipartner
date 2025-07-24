import { Mic } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
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
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = useRef('')

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    setIsListening(false)
  }

  const handleAudioMessage = () => {
    // Stop listening if already listening
    if (isListening) {
      stopListening()
      return
    }

    // Check browser support
    if (!window || !('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not available in this browser')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (window as any).webkitSpeechRecognition()
    recognitionRef.current = recognition
    finalTranscriptRef.current = ''

    // Set recognition options
    recognition.continuous = true
    recognition.interimResults = true

    // Start listening
    setIsListening(true)

    recognition.onstart = () => {
      console.log('Speech recognition started')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = finalTranscriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      finalTranscriptRef.current = finalTranscript

      const fullTranscript = finalTranscript + interimTranscript
      if (fullTranscript.trim()) {
        setInput(
          currentInput + (currentInput ? ' ' : '') + fullTranscript.trim(),
        )
      }

      //Reset silence timeout when we have final results
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }

      //Reset timeout on new speech
      silenceTimeoutRef.current = setTimeout(() => {
        stopListening()
      }, 3000)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)

      // Don't show alert for common errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        alert('Speech recognition error: ' + event.error)
      }

      stopListening()
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)

      // Clean up timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = null
      }

      // Ensure final transcript is applied
      if (finalTranscriptRef.current.trim()) {
        setInput(
          currentInput +
            (currentInput ? ' ' : '') +
            finalTranscriptRef.current.trim(),
        )
      }
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      stopListening()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [])

  return (
    <button
      className={`${styles.button} ${isListening ? styles.buttonOn : ''}`}
      onClick={handleAudioMessage}
      title={isListening ? 'Stop listening' : 'Start voice input'}>
      <Mic size={18} />
    </button>
  )
}
