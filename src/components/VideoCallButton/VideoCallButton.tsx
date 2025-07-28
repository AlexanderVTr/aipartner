'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Video, VideoOff } from 'lucide-react'
import styles from './VideoCallButton.module.scss'
import StreamingAvatar, {
  AvatarQuality,
  StartAvatarRequest,
  VoiceChatTransport,
  VoiceEmotion,
  ElevenLabsModel,
  STTProvider,
  StreamingEvents,
  TaskMode,
  TaskType,
} from '@heygen/streaming-avatar'

interface VideoCallButtonProps {
  currentInput: string
  onMessageSend: (newText: string) => void
}

export default function VideoCallButton({
  currentInput,
  onMessageSend,
}: VideoCallButtonProps) {
  const [isVideoCall, setIsVideoCall] = useState(false)
  const avatarRef = useRef<StreamingAvatar | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [heyGenToken, setHeyGenToken] = useState<string | undefined>(undefined)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const avatarConfig: StartAvatarRequest = {
    quality: AvatarQuality.Low,
    avatarName: 'Ann_Therapist_public', // Публичный аватар
    voice: {
      rate: 1.0,
      emotion: VoiceEmotion.EXCITED,
      model: ElevenLabsModel.eleven_flash_v2_5,
    },
    //TODO: Add languages here
    language: 'en',
    voiceChatTransport: VoiceChatTransport.WEBSOCKET,
    sttSettings: {
      provider: STTProvider.DEEPGRAM,
    },
  }

  // AVATAR INITIALIZATION
  const onInitAvatar = async () => {
    console.log(
      'onInitAvatar called, heyGenToken:',
      heyGenToken ? 'exists' : 'missing',
    )

    if (!heyGenToken) {
      console.log('No token, returning')
      return
    }

    try {
      console.log(
        'Creating StreamingAvatar with token and basePath:',
        process.env.NEXT_PUBLIC_BASE_API_URL_HEYGEN,
      )
      avatarRef.current = new StreamingAvatar({
        token: heyGenToken,
        basePath: process.env.NEXT_PUBLIC_BASE_API_URL_HEYGEN,
      })
      console.log('Avatar initialized', avatarRef.current)

      avatarRef.current.on(StreamingEvents.STREAM_READY, (event) => {
        setIsConnected(true)
        setIsConnecting(false)

        if (videoRef.current && event.detail) {
          const stream = event.detail
          videoRef.current.srcObject = stream
          videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error)
          })
        }
      })

      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        setIsConnected(false)
        setIsConnecting(false)
      })

      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        // Avatar started talking
      })

      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        // Avatar stopped talking
      })

      // Add correct event handlers from official demo
      avatarRef.current.on(StreamingEvents.USER_START, (event) => {
        // User started talking
      })

      avatarRef.current.on(StreamingEvents.USER_STOP, (event) => {
        // User stopped talking
      })

      avatarRef.current.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        // User end message
      })

      avatarRef.current.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        // User talking message
      })

      avatarRef.current.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        // Avatar talking message
      })

      avatarRef.current.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        // Avatar end message
      })
    } catch (error) {
      console.error('Error initializing avatar:', error)
    }
  }

  // AVATAR START
  const onStartAvatar = async () => {
    console.log(
      'onStartAvatar called, avatarRef.current:',
      avatarRef.current ? 'exists' : 'null',
    )

    if (!avatarRef.current) {
      console.log('No avatar reference, returning')
      return
    }

    try {
      console.log('Setting isConnecting to true')
      setIsConnecting(true)
      console.log('Calling createStartAvatar with config:', avatarConfig)
      await avatarRef.current.createStartAvatar(avatarConfig)
      console.log('Avatar started successfully', avatarRef.current)
    } catch (error) {
      console.error('Error starting avatar:', error)
      setIsConnecting(false)
    }
  }

  // AVATAR STOP
  const onStopAvatar = async () => {
    if (!avatarRef.current) return
    try {
      await avatarRef.current.stopAvatar()
      setIsConnecting(false)
    } catch (error) {
      console.error('Error stopping avatar:', error)
    }
  }

  const onSendText = useCallback(async (text: string) => {
    if (!avatarRef.current) return

    try {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.TALK,
        taskMode: TaskMode.ASYNC,
      })
    } catch (error) {
      console.error('Error sending text:', error)
      // In official demo, they don't handle 401 errors specially
      // User needs to restart the session manually
    }
  }, [])

  const handleVideoCallOn = async () => {
    try {
      // Always get a fresh token for each session
      await getNewToken()
      setIsVideoCall(true)

      // Wait for avatar to be initialized
      await new Promise<void>((resolve) => {
        const checkAvatar = () => {
          if (avatarRef.current) {
            resolve()
          } else {
            setTimeout(checkAvatar, 100)
          }
        }
        checkAvatar()
      })

      await onStartAvatar()
      setPendingMessage('Hello')
    } catch (error) {
      console.error('Error in handleVideoCallOn:', error)
    }
  }

  const handleVideoCallOff = () => {
    setIsVideoCall(false)
    onStopAvatar()
    // Clear the token when stopping the session
    setHeyGenToken(undefined)
  }

  const getNewToken = async () => {
    try {
      const response = await fetch('/api/heygen/token', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to get token')
      }

      const data = await response.json()
      const newToken = data.token
      setHeyGenToken(newToken)
      return newToken
    } catch (error) {
      console.error('Error getting HeyGen token:', error)
      throw error
    }
  }

  useEffect(() => {
    if (heyGenToken) {
      onInitAvatar()
    }
  }, [heyGenToken])

  // Send pending message when connected
  useEffect(() => {
    if (isConnected && pendingMessage) {
      const messageToSend = pendingMessage
      setPendingMessage(null) // Clear immediately to prevent re-sending
      onSendText(messageToSend)
    }
  }, [isConnected, pendingMessage, onSendText])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        onStopAvatar()
      }
    }
  }, [])

  return (
    <>
      <button
        className={`${styles.button} ${isVideoCall ? styles.buttonOn : ''}`}
        disabled={isVideoCall}
        onClick={handleVideoCallOn}>
        <Video size={18} />
      </button>
      {isVideoCall && (
        <div className={styles.callFrame}>
          <div className={styles.videoContainer}>
            {isClient && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls={false}
                className={styles.avatarVideo}
              />
            )}
          </div>
          <div className={styles.callFrameActions}>
            <div className={styles.connectionStatus}>
              <div
                className={`${
                  isConnected
                    ? styles.connected
                    : isConnecting
                      ? styles.connecting
                      : styles.disconnected
                }`}>
                {isConnected
                  ? 'Connected'
                  : isConnecting
                    ? 'Connecting...'
                    : 'Disconnected'}
              </div>
            </div>
            <button
              className={`${styles.button}`}
              onClick={() => handleVideoCallOff()}>
              <VideoOff size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
