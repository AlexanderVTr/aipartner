import { useCallback, useRef, useState } from 'react'

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.log('Error getting stream', error)
    }
  }, [])

  const stopRecording = useCallback(() => {
    return new Promise<Blob>((resolve, reject) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          try {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
            setIsRecording(false)
            resolve(blob) // Return the blob directly
          } catch (error) {
            reject(error)
          }
        }

        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop())
      } else {
        reject(new Error('No recording in progress'))
      }
    })
  }, [isRecording])

  const createAudioFile = useCallback((blob: Blob) => {
    return new File([blob], 'recording.webm', { type: 'audio/webm' })
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    createAudioFile,
  }
}
