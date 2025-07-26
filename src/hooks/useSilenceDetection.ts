import { useRef, useCallback } from 'react'

interface SilenceDetectionOptions {
  silenceThreshold?: number
  silenceDuration?: number
  onSilenceDetected: () => void
}

export function useSilenceDetection({
  silenceThreshold = 30,
  silenceDuration = 3000,
  onSilenceDetected,
}: SilenceDetectionOptions) {
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const isMonitoringRef = useRef(false)

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isMonitoringRef.current) return

    // Get data about voice level
    const bufferLength = analyserRef.current?.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / bufferLength

    if (average < silenceThreshold) {
      // Silence detected - run timer if not running
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          console.log('Silence timeout triggered!')
          onSilenceDetected()
        }, silenceDuration)
      }
    } else {
      // Voice detected - clear timer
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }, [silenceThreshold, silenceDuration, onSilenceDetected])

  const startMonitoring = useCallback(async () => {
    try {
      // Get access to microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create AudioContext
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()

      //Setup analyzer
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Run Analyzer
      isMonitoringRef.current = true
      analyzeAudio()
    } catch (error) {
      console.error('Error setting up audio analysis', error)
    }
  }, [analyzeAudio])

  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false

    // Clear timer
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }

    // Clean and cancel analyzer
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Close audiocontext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    audioContextRef.current = null
    analyserRef.current = null
  }, [])
  return {
    startMonitoring,
    stopMonitoring,
  }
}
