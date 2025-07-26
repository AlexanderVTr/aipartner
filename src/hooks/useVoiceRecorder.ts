import { useCallback, useRef } from 'react'

export function useVoiceRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Silence detection refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const onSilenceDetectedRef = useRef<(() => void) | null>(null)
  const isRecordingRef = useRef(false) // Sync ref for recording state
  const streamRef = useRef<MediaStream | null>(null) // Stream reference for cleanup

  const analyzeAudio = useCallback(
    (silenceThreshold: number, silenceDuration: number) => {
      if (!analyserRef.current || !isRecordingRef.current) {
        return
      }

      // Get audio level data
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray)

      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / bufferLength

      if (average < silenceThreshold) {
        // Silence detected - start timer if not already running
        if (!silenceTimeoutRef.current && onSilenceDetectedRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (onSilenceDetectedRef.current && isRecordingRef.current) {
              onSilenceDetectedRef.current()
            }
          }, silenceDuration)
        }
      } else {
        // Voice detected - clear timer
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = null
        }
      }

      if (isRecordingRef.current) {
        animationFrameRef.current = requestAnimationFrame(() =>
          analyzeAudio(silenceThreshold, silenceDuration),
        )
      }
    },
    [],
  )

  const startRecording = useCallback(
    async (options?: {
      silenceThreshold?: number
      silenceDuration?: number
      onSilenceDetected?: () => void
    }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        streamRef.current = stream // Save stream reference

        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          chunksRef.current.push(event.data)
        }

        mediaRecorder.start()
        isRecordingRef.current = true // Sync ref

        // Setup silence detection if options provided
        if (options?.onSilenceDetected) {
          onSilenceDetectedRef.current = options.onSilenceDetected

          audioContextRef.current = new AudioContext()
          const source = audioContextRef.current.createMediaStreamSource(stream)
          analyserRef.current = audioContextRef.current.createAnalyser()

          analyserRef.current.fftSize = 256
          source.connect(analyserRef.current)

          // Start analyzing
          analyzeAudio(
            options.silenceThreshold || 30,
            options.silenceDuration || 3000,
          )
        }
      } catch (error) {
        console.log('Error getting stream', error)
        // Cleanup if there was an error
        isRecordingRef.current = false
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
        cleanup()
      }
    },
    [analyzeAudio],
  )

  const stopRecording = useCallback(() => {
    return new Promise<Blob>((resolve, reject) => {
      if (mediaRecorderRef.current && isRecordingRef.current) {
        mediaRecorderRef.current.onstop = () => {
          try {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
            isRecordingRef.current = false // Sync ref

            // Cleanup silence detection
            onSilenceDetectedRef.current = null

            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current)
              silenceTimeoutRef.current = null
            }

            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current)
              animationFrameRef.current = null
            }

            if (
              audioContextRef.current &&
              audioContextRef.current.state !== 'closed'
            ) {
              audioContextRef.current.close()
            }
            audioContextRef.current = null
            analyserRef.current = null

            // Stop all media tracks properly
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => {
                track.stop()
              })
              streamRef.current = null
            }

            resolve(blob)
          } catch (error) {
            reject(error)
          }
        }

        mediaRecorderRef.current.stop()
      } else {
        reject(new Error('No recording in progress'))
      }
    })
  }, [])

  const createAudioFile = useCallback((blob: Blob) => {
    return new File([blob], 'recording.webm', { type: 'audio/webm' })
  }, [])

  const cleanup = useCallback(() => {
    isRecordingRef.current = false

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    audioContextRef.current = null
    analyserRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }
    onSilenceDetectedRef.current = null
  }, [])

  return {
    isRecordingRef, // Export ref for sync state checking
    startRecording,
    stopRecording,
    createAudioFile,
    cleanup,
  }
}
