'use client'
import { useEffect, useRef, useState } from 'react'
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
        console.log('STREAM_READY event fired:', event)
        console.log('Event detail:', event.detail)
        setIsConnected(true)
        setIsConnecting(false)
        console.log('Connection state updated: isConnected = true')

        if (videoRef.current && event.detail) {
          const stream = event.detail
          console.log('Setting video stream:', stream)
          console.log('Video element before setting stream:', videoRef.current)

          videoRef.current.srcObject = stream
          console.log('Stream set to video element')

          videoRef.current
            .play()
            .then(() => {
              console.log('Video started playing successfully')
            })
            .catch((error) => {
              console.error('Error playing video:', error)
            })

          // Add event listeners to debug video
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded')
          })

          videoRef.current.addEventListener('canplay', () => {
            console.log('Video can play')
          })

          videoRef.current.addEventListener('playing', () => {
            console.log('Video is playing')
          })

          console.log('Video stream set successfully')
        } else {
          console.log('No videoRef or event.detail')
          console.log('videoRef.current:', videoRef.current)
          console.log('event.detail:', event.detail)
        }
      })

      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream disconnected')
        setIsConnected(false)
        setIsConnecting(false)
      })

      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('Avatar started talking')
      })

      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('Avatar stopped talking')
      })

      // Add correct event handlers from official demo
      avatarRef.current.on(StreamingEvents.USER_START, (event) => {
        console.log('User started talking:', event)
      })

      avatarRef.current.on(StreamingEvents.USER_STOP, (event) => {
        console.log('User stopped talking:', event)
      })

      avatarRef.current.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log('User end message:', event)
      })

      avatarRef.current.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log('User talking message:', event)
      })

      avatarRef.current.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log('Avatar talking message:', event)
      })

      avatarRef.current.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log('Avatar end message:', event)
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

  const onSendText = async (text: string) => {
    if (!avatarRef.current) return

    try {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.TALK,
        taskMode: TaskMode.ASYNC,
      })
    } catch (error) {
      console.error('Error sending text:', error)
    }
  }

  const handleVideoCallOn = async () => {
    try {
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
      onSendText(pendingMessage)
      setPendingMessage(null)
    }
  }, [isConnected, pendingMessage])

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
