import { useState } from 'react'
import { Phone, PhoneOffIcon } from 'lucide-react'
import styles from './SpeechToTextAdvancedButton.module.scss'
import { convertSpeechToText } from '@/lib/ai/ElevenLabs/ElevenLabs'
import { useVoiceRecorder } from '@/lib/FilesOperations/useVoiceRecorder'
import { useSilenceDetection } from '@/hooks/useSilenceDetection'

interface SpeechToTextSimpleButtonProps {
  currentInput: string
  setInput: (input: string) => void
}

export default function SpeechToTextAdvancedButton({
  currentInput,
  setInput,
}: SpeechToTextSimpleButtonProps) {
  const [isVideoCall, setIsVideoCall] = useState(false)
  const { isRecording, startRecording, stopRecording, createAudioFile } =
    useVoiceRecorder()

  const handleCallOff = async () => {
    stopMonitoring()
    await finishRecording()
    setIsVideoCall(false)
  }

  const { startMonitoring, stopMonitoring } = useSilenceDetection({
    silenceThreshold: 30,
    silenceDuration: 3000,
    onSilenceDetected: handleCallOff,
  })

  const handleCallOn = async () => {
    setIsVideoCall(true)
    try {
      await startRecording()
      await startMonitoring()
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const finishRecording = async () => {
    if (!isRecording) {
      return
    }

    try {
      const audioBlob = await stopRecording()
      const audioFile = createAudioFile(audioBlob)

      const transcription = await convertSpeechToText(audioFile)
      console.log('Transcription:', transcription)

      if (transcription.text) {
        setInput(currentInput + (currentInput ? ' ' : '') + transcription.text)
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
    }
  }

  return (
    <>
      <button className={`${styles.button}`} onClick={handleCallOn}>
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
            <button className={`${styles.button}`} onClick={handleCallOff}>
              <PhoneOffIcon size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
