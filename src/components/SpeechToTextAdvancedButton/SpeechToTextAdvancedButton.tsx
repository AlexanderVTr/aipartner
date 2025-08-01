import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOffIcon } from 'lucide-react'
import styles from './SpeechToTextAdvancedButton.module.scss'
import { convertSpeechToText } from '@/lib/ai/ElevenLabs/ElevenLabs'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { SILENCE_DURATION, SILENCE_THRESHOLD } from '@/constants/chat'

interface SpeechToTextSimpleButtonProps {
  currentInput: string
  onMessageSend: (newText: string) => void
}

export default function SpeechToTextAdvancedButton({
  currentInput,
  onMessageSend,
}: SpeechToTextSimpleButtonProps) {
  const [isVideoCall, setIsVideoCall] = useState(false)
  const {
    isRecordingRef,
    startRecording,
    stopRecording,
    createAudioFile,
    cleanup,
  } = useVoiceRecorder()
  const isProcessingRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const handleCallOff = async (isManualClick: boolean = false) => {
    if (isProcessingRef.current) {
      return
    }

    isProcessingRef.current = true

    // For manual click - close UI immediately for better UX
    if (isManualClick) {
      setIsVideoCall(false)
      cleanup() // Stop recording immediately

      // Process any remaining recording in background
      try {
        await finishRecording()
      } catch (error) {
        console.error('Error processing final recording:', error)
      }
    } else {
      // For automatic silence detection - process recording first, then restart
      await finishRecording()

      // Restart recording for next message
      try {
        await startRecording({
          silenceThreshold: SILENCE_THRESHOLD,
          silenceDuration: SILENCE_DURATION,
          onSilenceDetected: () => handleCallOff(false), // Auto-stop on silence - don't close UI
        })
      } catch (error) {
        console.error('Error restarting recording:', error)
        // If restart fails, close the UI
        setIsVideoCall(false)
        cleanup()
      }
    }

    isProcessingRef.current = false
  }

  const handleCallOn = async () => {
    setIsVideoCall(true)
    try {
      await startRecording({
        silenceThreshold: SILENCE_THRESHOLD,
        silenceDuration: SILENCE_DURATION,
        onSilenceDetected: () => handleCallOff(false), // Auto-stop on silence - don't close UI
      })
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const finishRecording = async () => {
    if (!isRecordingRef.current) {
      return
    }

    try {
      const audioBlob = await stopRecording()

      if (audioBlob.size < 1000) {
        console.log('Audio file too small, skipping transcription')
        return
      }

      const audioFile = createAudioFile(audioBlob)

      // Retry logic for ElevenLabs API in case load balancer or network errors
      let transcription = null
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts && !transcription?.text) {
        attempts++

        try {
          transcription = await convertSpeechToText(audioFile)

          if (transcription?.text) {
            break
          } else {
            if (attempts < maxAttempts) {
              const delay = 1000 * attempts
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          }
        } catch (apiError) {
          console.error(
            `ElevenLabs API error on attempt ${attempts}:`,
            apiError,
          )
          if (attempts < maxAttempts) {
            const delay = 1000 * Math.pow(2, attempts - 1)
            await new Promise((resolve) => setTimeout(resolve, delay))
          } else {
            console.error('💥 All transcription attempts failed')
          }
        }
      }

      // Apply result
      if (transcription?.text) {
        // Next get message from the Assistent and call new ELEVENLabs api connected to Text to speech
        const newText =
          currentInput + (currentInput ? ' ' : '') + transcription.text
        console.log(newText)
        await onMessageSend(newText)
      }
    } catch (error) {
      console.error('Error in finishRecording:', error)
    }
  }

  return (
    <>
      <button
        className={`${styles.button} ${isVideoCall ? styles.buttonOn : ''}`}
        disabled={isVideoCall}
        onClick={handleCallOn}>
        <Phone size={18} />
      </button>
      {isVideoCall && (
        <div className={styles.callFrame}>
          <div className={styles.videoContainer}>
            <video
              src='/assets/avatar/Aishav1.mp4'
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              className={styles.avatarVideo}
            />
          </div>
          <div className={styles.callFrameActions}>
            <button
              className={`${styles.button}`}
              onClick={() => handleCallOff(true)}>
              <PhoneOffIcon size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
