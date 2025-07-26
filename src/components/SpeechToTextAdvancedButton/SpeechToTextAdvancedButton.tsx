import { Phone, PhoneOffIcon } from 'lucide-react'
import styles from './SpeechToTextAdvancedButton.module.scss'
import { convertSpeechToText } from '@/lib/ai/ElevenLabs/ElevenLabs'
import { useVoiceRecorder } from '@/lib/FilesOperations/useVoiceRecorder'

interface SpeechToTextSimpleButtonProps {
  currentInput: string
  setInput: (input: string) => void
}

export default function SpeechToTextAdvancedButton({
  currentInput,
  setInput,
}: SpeechToTextSimpleButtonProps) {
  const { startRecording, stopRecording, createAudioFile } = useVoiceRecorder()

  const handleCallOn = async () => {
    try {
      await startRecording()
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const handleCallOff = async () => {
    try {
      const audioBlob = await stopRecording()
      const audioFile = createAudioFile(audioBlob)

      console.log('Audio file created:', audioFile.size, 'bytes')

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
      <button className={`${styles.button}`} onClick={handleCallOff}>
        <PhoneOffIcon size={18} />
      </button>
    </>
  )
}
