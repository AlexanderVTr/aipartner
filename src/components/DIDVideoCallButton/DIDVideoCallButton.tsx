'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Video, VideoOff, Mic, MicOff } from 'lucide-react'
import styles from './DIDVideoCallButton.module.scss'
import { didAgentConfig } from '@/lib/ai/DID/agentConfig'
import { getClientKey } from '@/lib/ai/DID/getClientKey'
import VideoCallStatus from '@/components/UI/VideoCallStatus/VideoCallStatus'
import { useTokens } from '@/contexts/TokensContext'
import Tooltip from '../UI/Tooltip/Tooltip'
import { TOOLTIP_CONTENT } from '@/constants/chat'
import { useRouter } from 'next/navigation'
import { Button } from '../UI'
import { checkMicrophoneAccess } from '@/helpers/helpers'

interface DIDStreamResponse {
  id: string
  session_id: string
  offer: {
    type: 'offer'
    sdp: string
  }
  ice_servers: Array<{
    urls: string[]
    username?: string
    credential?: string
  }>
}

export default function DIDVideoCallButton() {
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isVideoCallDisabled, setIsVideoCallDisabled] = useState(true)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const { tokens } = useTokens()
  const router = useRouter()

  useEffect(() => {
    if (tokens > 101) {
      setIsVideoCallDisabled(false)
    }
  }, [tokens])

  // Create new stream and establish WebRTC connection
  const createStream = async () => {
    try {
      const DID_API_URL = process.env.NEXT_PUBLIC_DID_API_URL || 'https://api.d-id.com'
      const clientKey = await getClientKey()

      // Step 1: Create a new stream
      // Use Basic auth instead of Bearer for D-ID streaming
      const streamResponse = await fetch(
        `${DID_API_URL}/agents/${didAgentConfig.agentId}/streams`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${clientKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            compatibility_mode: didAgentConfig.compatibilityMode,
            fluent: didAgentConfig.fluent,
          }),
        }
      )

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text()
        console.error('Failed to create stream:', errorText)
        throw new Error(`Failed to create D-ID stream: ${streamResponse.status}`)
      }

      const streamData: DIDStreamResponse = await streamResponse.json()
      console.log('Stream created:', streamData.id)
      console.log('Session ID:', streamData.session_id)
      
      setStreamId(streamData.id)
      setSessionId(streamData.session_id)

      return { streamData, clientKey }
    } catch (error) {
      console.error('Error creating stream:', error)
      throw error
    }
  }

  // Initialize WebRTC peer connection
  const initializePeerConnection = async (
    streamData: DIDStreamResponse,
    clientKey: string
  ) => {
    try {
      const DID_API_URL = process.env.NEXT_PUBLIC_DID_API_URL || 'https://api.d-id.com'
      
      console.log('Initializing WebRTC with ICE servers:', streamData.ice_servers)
      
      // Create peer connection with ICE servers from D-ID
      const peerConnection = new RTCPeerConnection({
        iceServers: streamData.ice_servers,
      })

      peerConnectionRef.current = peerConnection

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
          videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error)
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState)
        if (peerConnection.connectionState === 'connected') {
          setIsConnected(true)
          setIsConnecting(false)
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          setIsConnected(false)
          setIsConnecting(false)
        }
      }

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState)
        if (peerConnection.iceConnectionState === 'connected' || 
            peerConnection.iceConnectionState === 'completed') {
          setIsConnected(true)
          setIsConnecting(false)
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await fetch(
              `${DID_API_URL}/agents/${didAgentConfig.agentId}/streams/${streamData.id}/ice`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${clientKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  candidate: event.candidate.candidate,
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex,
                  session_id: streamData.session_id,
                }),
              }
            )
          } catch (error) {
            console.error('Error sending ICE candidate:', error)
          }
        } else {
          // End of ICE gathering
          try {
            await fetch(
              `${DID_API_URL}/agents/${didAgentConfig.agentId}/streams/${streamData.id}/ice`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${clientKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  session_id: streamData.session_id,
                }),
              }
            )
          } catch (error) {
            console.error('Error sending final ICE signal:', error)
          }
        }
      }

      // Set remote description (SDP offer from server)
      console.log('Setting remote SDP offer...')
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(streamData.offer)
      )

      // Create answer
      console.log('Creating SDP answer...')
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      console.log('SDP answer created')

      // Send answer to server
      console.log('Sending SDP answer to server...')
      const sdpResponse = await fetch(
        `${DID_API_URL}/agents/${didAgentConfig.agentId}/streams/${streamData.id}/sdp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${clientKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answer: {
              type: answer.type,
              sdp: answer.sdp,
            },
            session_id: streamData.session_id,
          }),
        }
      )

      if (!sdpResponse.ok) {
        const sdpError = await sdpResponse.text()
        console.error('Failed to send SDP answer:', sdpError)
        throw new Error('Failed to send SDP answer')
      }

      console.log('SDP answer sent successfully')
      console.log('WebRTC connection establishing...')
    } catch (error) {
      console.error('Error initializing peer connection:', error)
      throw error
    }
  }

  // Create chat session
  const createChat = async (clientKey: string) => {
    try {
      const DID_API_URL = process.env.NEXT_PUBLIC_DID_API_URL || 'https://api.d-id.com'
      const response = await fetch(
        `${DID_API_URL}/agents/${didAgentConfig.agentId}/chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${clientKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create chat')
      }

      const data = await response.json()
      setChatId(data.id)
      return data.id
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  // Start voice chat
  const startVoiceChat = async () => {
    if (!peerConnectionRef.current || !isConnected) return

    try {
      const hasAccess = await checkMicrophoneAccess()
      if (!hasAccess) {
        alert('Cannot start voice chat without microphone access')
        return
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      
      mediaStreamRef.current = stream

      // Add audio track to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream)
      })

      setIsVoiceChatActive(true)
      console.log('Voice chat started')
    } catch (error) {
      console.error('Error starting voice chat:', error)
      alert('Cannot start voice chat without microphone access')
    }
  }

  // Stop voice chat
  const stopVoiceChat = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    setIsVoiceChatActive(false)
    console.log('Voice chat stopped')
  }

  // Handle video call on
  const handleVideoCallOn = async () => {
    try {
      setIsVideoCall(true)
      setIsConnecting(true)

      const { streamData, clientKey } = await createStream()
      await initializePeerConnection(streamData, clientKey)
      await createChat(clientKey)
    } catch (error) {
      console.error('Error in handleVideoCallOn:', error)
      setIsVideoCall(false)
      setIsConnecting(false)
    }
  }

  // Handle video call off
  const handleVideoCallOff = async () => {
    try {
      if (streamId && sessionId) {
        const DID_API_URL = process.env.NEXT_PUBLIC_DID_API_URL || 'https://api.d-id.com'
        const clientKey = await getClientKey()

        await fetch(
          `${DID_API_URL}/agents/${didAgentConfig.agentId}/streams/${streamId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${clientKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
            }),
          }
        )
      }
    } catch (error) {
      console.error('Error closing stream:', error)
    } finally {
      stopVoiceChat()
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      setIsVideoCall(false)
      setIsConnected(false)
      setIsConnecting(false)
      setStreamId(null)
      setSessionId(null)
      setChatId(null)
    }
  }

  // Handle microphone toggle
  const handleMicrophoneSwitch = async () => {
    if (!peerConnectionRef.current || !isConnected) return

    if (isVoiceChatActive) {
      stopVoiceChat()
    } else {
      await startVoiceChat()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        handleVideoCallOff()
      }
    }
  }, [])

  const tooltipContent = useMemo(() => {
    return (
      <>
        {TOOLTIP_CONTENT.VIDEO_CALL_DISABLED}
        <div className={styles.upgradePlanButton}>
          <Button
            variant='secondary'
            size='xs'
            onClick={() => router.push('/pricing')}>
            Upgrade plan
          </Button>
        </div>
      </>
    )
  }, [router])

  return (
    <>
      <Tooltip
        content={tooltipContent}
        show={isVideoCallDisabled}
        position='top'>
        <button
          className={`${styles.button} ${isVideoCall ? styles.buttonOn : ''}`}
          disabled={isVideoCallDisabled}
          onClick={handleVideoCallOn}>
          <Video size={18} />
        </button>
      </Tooltip>
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
            <VideoCallStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
            />
          </div>
          <div className={styles.callFrameActions}>
            <button
              disabled={!isConnected}
              className={`${styles.button} ${isVoiceChatActive ? styles.buttonOn : ''}`}
              onClick={handleMicrophoneSwitch}>
              {isVoiceChatActive ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
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

