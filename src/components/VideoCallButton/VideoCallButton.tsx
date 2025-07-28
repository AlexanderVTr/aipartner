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
import { getHeyGenToken } from '@/lib/ai/HeyGen/heygen-token'

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
    try {
      avatarRef.current = new StreamingAvatar({
        token: await getHeyGenToken(),
        basePath: process.env.NEXT_PUBLIC_BASE_API_URL_HEYGEN,
      })
      console.log('Avatar initialized', avatarRef.current)

      avatarRef.current.on(StreamingEvents.STREAM_READY, (event) => {
        console.log('Streaming ready', event)
        setIsConnected(true)
        setIsConnecting(false)

        if (videoRef.current && event.detail) {
          const stream = event.detail
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(console.error)
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
    } catch (error) {
      console.error('Error initializing avatar:', error)
    }
  }

  // AVATAR START
  const onStartAvatar = async () => {
    if (!avatarRef.current) return

    try {
      setIsConnecting(true)
      await avatarRef.current.createStartAvatar(avatarConfig)
      console.log('Avatar started', avatarRef.current)
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
    setIsVideoCall(true)
    await onStartAvatar()
    // Wait for connection to be established before sending message
    const checkConnection = () => {
      if (isConnected) {
        onSendText('Hello')
      } else {
        setTimeout(checkConnection, 500)
      }
    }
    setTimeout(checkConnection, 1000)
  }

  const handleVideoCallOff = () => {
    setIsVideoCall(false)
    onStopAvatar()
  }

  useEffect(() => {
    onInitAvatar()
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls={false}
              className={styles.avatarVideo}
            />
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
