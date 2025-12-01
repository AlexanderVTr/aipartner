'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Video, VideoOff, Mic, MicOff } from 'lucide-react'
import { Room, RoomEvent, Track } from 'livekit-client'
import styles from './BeyondPresenceVideoCallButton.module.scss'
import { getBeyondPresenceSession } from '@/lib/ai/BeyondPresence/getSession'
import { closeBeyondPresenceSession } from '@/lib/ai/BeyondPresence/closeSession'
import { beyondPresenceConfig } from '@/lib/ai/BeyondPresence/config'
import VideoCallStatus from '@/components/UI/VideoCallStatus/VideoCallStatus'
import { useTokens } from '@/contexts/TokensContext'
import Tooltip from '../UI/Tooltip/Tooltip'
import { TOOLTIP_CONTENT } from '@/constants/chat'
import { useRouter } from 'next/navigation'
import { Button } from '../UI'
import { checkMicrophoneAccess } from '@/helpers/helpers'

// Helper function to get human-readable disconnect reason
function getDisconnectReason(reason: any): string {
  switch (reason) {
    case 1:
      return 'CLIENT_INITIATED'
    case 2:
      return 'CONNECTION_TIMEOUT'
    case 3:
      return 'CONNECTION_UNAVAILABLE'
    case 4:
      return 'CONNECTION_LOST'
    case 5:
      return 'CONNECTION_DISCONNECTED'
    case 6:
      return 'CONNECTION_FAILED'
    default:
      return `UNKNOWN (${reason})`
  }
}

export default function BeyondPresenceVideoCallButton() {
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isVideoCallDisabled, setIsVideoCallDisabled] = useState(true)
  const roomRef = useRef<Room | null>(null)
  const videoRef = useRef<HTMLDivElement | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false)
  const [sessionData, setSessionData] = useState<{
    sessionId: string
    wsUrl?: string
    token?: string
    avatarId?: string
  } | null>(null)

  const { tokens } = useTokens()
  const router = useRouter()

  useEffect(() => {
    if (tokens > 101) {
      setIsVideoCallDisabled(false)
    }
  }, [tokens])

  // Initialize and connect to Beyond Presence session
  const onStartSession = async () => {
    if (!beyondPresenceConfig.avatarId) {
      console.error('Avatar ID is not configured')
      return
    }

    // Prevent multiple simultaneous session creations
    if (isConnecting) {
      console.log('Session creation already in progress')
      return
    }

    try {
      setIsConnecting(true)

      // Get session from Beyond Presence API
      // Only avatarId is required, agentId is optional
      const session = await getBeyondPresenceSession(
        beyondPresenceConfig.avatarId,
      )

      setSessionData({
        sessionId: session.id || session.session_id || '',
        wsUrl: session.livekit?.url || session.url,
        token: session.livekit?.token,
        avatarId: session.avatar_id,
      })

      // Initialize LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      roomRef.current = room

      // Set up event listeners for remote participants (avatar agent)
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity, {
          isLocal: participant.isLocal,
          connectionQuality: participant.connectionQuality,
        })

        // Log all tracks for debugging
        console.log('Participant tracks:', {
          video: Array.from(participant.videoTrackPublications.values()).map(
            (pub) => ({
              sid: pub.trackSid,
              subscribed: pub.isSubscribed,
              enabled: pub.isEnabled,
            }),
          ),
          audio: Array.from(participant.audioTrackPublications.values()).map(
            (pub) => ({
              sid: pub.trackSid,
              subscribed: pub.isSubscribed,
              enabled: pub.track ? (pub.track as any).isEnabled : false,
            }),
          ),
        })

        // Tracks are automatically subscribed by LiveKit client
        // No need to manually subscribe - this is handled by the TrackSubscribed event
      })

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log(
          '🎬 TRACK SUBSCRIBED:',
          track.kind,
          'from',
          participant.identity,
        )
        console.log('Track details:', {
          kind: track.kind,
          source: track.source,
          mediaStreamTrack: !!track.mediaStreamTrack,
          isEnabled: (track as any).isEnabled || false,
          isMuted: track.isMuted,
        })

        // TrackSubscribed only fires for remote participants (avatar agent)
        if (track.kind === 'video' && videoRef.current) {
          console.log('🎥 Attaching video track to DOM...')
          // Attach remote video track from avatar agent
          const videoElement = track.attach()
          console.log(
            'Video element created:',
            !!videoElement,
            videoElement?.tagName,
          )

          if (videoElement instanceof HTMLVideoElement) {
            // Clear any existing video elements
            while (videoRef.current.firstChild) {
              videoRef.current.removeChild(videoRef.current.firstChild)
            }

            // Add event listeners to debug video playback
            videoElement.addEventListener('loadstart', () =>
              console.log('🎬 Video loadstart'),
            )
            videoElement.addEventListener('loadeddata', () =>
              console.log('🎬 Video loadeddata'),
            )
            videoElement.addEventListener('canplay', () =>
              console.log('🎬 Video canplay'),
            )
            videoElement.addEventListener('play', () =>
              console.log('🎬 Video play'),
            )
            videoElement.addEventListener('playing', () =>
              console.log('🎬 Video playing'),
            )
            videoElement.addEventListener('error', (e) =>
              console.error('🎬 Video error:', e),
            )

            videoRef.current.appendChild(videoElement)
            console.log('Video element appended to DOM')

            // Try to play the video
            videoElement
              .play()
              .then(() => console.log('🎬 Video play() succeeded'))
              .catch((error) => {
                console.error('🎬 Video play() failed:', error)
                // Try muted autoplay as fallback
                videoElement.muted = true
                videoElement.play().catch((err2) => {
                  console.error('🎬 Video play() failed even muted:', err2)
                })
              })
          } else {
            console.warn(
              '🎬 Track.attach() did not return HTMLVideoElement:',
              videoElement,
            )
          }
        } else if (track.kind === 'audio') {
          console.log('🎵 Audio track attached')
          // Audio tracks are handled automatically by LiveKit
        }
      })

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track, publication, participant) => {
          console.log('Track unsubscribed:', track.kind)
          track.detach()
          if (videoRef.current) {
            // Clear video element
            while (videoRef.current.firstChild) {
              videoRef.current.removeChild(videoRef.current.firstChild)
            }
          }
        },
      )

      room.on(RoomEvent.Connected, () => {
        console.log('LiveKit room connected successfully!')
        console.log('Connection details:', {
          localIdentity: room.localParticipant.identity,
          remoteParticipants: Array.from(room.remoteParticipants.keys()),
          roomName: room.name,
          serverInfo: room.serverInfo,
        })
        setIsConnected(true)
        setIsConnecting(false)

        // Check if avatar agent is already in the room
        if (room.remoteParticipants.size > 0) {
          console.log('Avatar agent already in room at connection time')
        } else {
          console.log(
            'LiveKit connected, now waiting for Beyond Presence avatar agent...',
          )
        }
      })

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('LiveKit connection state changed:', state)
      })

      room.on(RoomEvent.Reconnecting, () => {
        console.log('LiveKit reconnecting...')
      })

      room.on(RoomEvent.Reconnected, () => {
        console.log('LiveKit reconnected successfully')
      })

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('🚨 LiveKit disconnected:', {
          reason,
          code: reason,
          message: getDisconnectReason(reason),
          wasConnected: room.state === 'connected',
        })
        setIsConnected(false)
        setIsConnecting(false)
        setIsVoiceChatActive(false)
      })

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('🔄 LiveKit connection state changed:', state)
        if (state === 'connected') {
          console.log('✅ LiveKit FULLY CONNECTED - ready for avatar agent')
        } else if (state === 'disconnected') {
          console.log('❌ LiveKit DISCONNECTED - avatar agent cannot join')
        }
      })

      room.on(RoomEvent.LocalTrackPublished, () => {
        setIsVoiceChatActive(true)
      })

      room.on(RoomEvent.LocalTrackUnpublished, () => {
        setIsVoiceChatActive(false)
      })

      // Connect to LiveKit room using the connection info from session
      // Beyond Presence session includes LiveKit connection details
      const wsUrl = session.livekit?.url || session.url
      const token = session.livekit?.token
      const roomName = session.livekit?.room

      if (!wsUrl || !token) {
        throw new Error('Missing LiveKit connection parameters from session')
      }

      console.log('Connecting to LiveKit room:', {
        url: wsUrl,
        room: roomName,
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20) + '...',
      })
      console.log('Full session response:', JSON.stringify(session, null, 2))

      // Connect to the room with enhanced error handling
      try {
        await room.connect(wsUrl, token)
        console.log('LiveKit connection established successfully')
      } catch (connectionError) {
        console.error('LiveKit connection failed:', connectionError)

        // If connection fails, Beyond Presence agent won't be able to join
        throw new Error(
          `Failed to connect to LiveKit room: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}. ` +
            'This prevents the Beyond Presence avatar from joining the session.',
        )
      }

      console.log('Connected to room, waiting for avatar agent...')

      // Wait for Beyond Presence agent to join (they connect after session creation)
      // Check every second for up to 60 seconds (agents may take longer to initialize)
      let agentCheckAttempts = 0
      const checkForAgent = setInterval(() => {
        agentCheckAttempts++
        const remoteCount = room.remoteParticipants.size
        const remoteParticipants = Array.from(room.remoteParticipants.values())

        if (remoteCount > 0) {
          console.log(
            '🎉 AVATAR AGENT JOINED! Remote participants:',
            remoteCount,
          )
          remoteParticipants.forEach((participant) => {
            console.log('Agent details:', {
              identity: participant.identity,
              connectionQuality: participant.connectionQuality,
              videoTracks: participant.videoTrackPublications.size,
              audioTracks: participant.audioTrackPublications.size,
              isSpeaking: participant.isSpeaking,
            })
          })
          clearInterval(checkForAgent)
        } else if (agentCheckAttempts >= 60) {
          console.error(
            '❌ Avatar agent did not join after 60 seconds.',
            'LiveKit connection is working, but Beyond Presence agent failed to connect.',
            'Possible issues:',
            '1. Avatar ID invalid or unavailable',
            '2. Beyond Presence session creation failed silently',
            '3. Avatar agent crashed or failed to start',
            '4. Network restrictions blocking agent connection',
            '5. Beyond Presence service temporarily unavailable',
            'Session details:',
            {
              sessionId: session.id,
              avatarId: session.avatar_id,
              transport: session.transport,
              livekitUrl: session.livekit?.url,
              roomName: session.livekit?.room,
            },
          )

          // Check session status on Beyond Presence side (async operation)
          fetch(`/api/beyond-presence/session/status?sessionId=${session.id}`)
            .then((response) => response.json())
            .then((statusData) => {
              console.log('Beyond Presence session status:', statusData)

              // Analyze the session data for issues
              if (statusData.sessionData) {
                const sessionData = statusData.sessionData
                console.log('Session analysis:', {
                  status: sessionData.status,
                  avatar_id: sessionData.avatar_id,
                  transport: sessionData.transport,
                  started_at: sessionData.started_at,
                  url: sessionData.url,
                  hasErrors: !!sessionData.error,
                  error: sessionData.error,
                })

                // Check if avatar ID matches what we requested
                if (sessionData.avatar_id !== session.avatar_id) {
                  console.warn('Avatar ID mismatch:', {
                    requested: session.avatar_id,
                    actual: sessionData.avatar_id,
                  })
                }
              }
            })
            .catch((statusError) => {
              console.error('Failed to check session status:', statusError)
            })

          // Clear any ongoing agent check interval
          if (checkForAgent) clearInterval(checkForAgent)
          clearInterval(checkForAgent)
        } else {
          console.log(`Waiting for avatar agent... (${agentCheckAttempts}/60)`)
        }
      }, 1000)
    } catch (error) {
      console.error('Error starting Beyond Presence session:', error)
      setIsConnecting(false)
      setIsVideoCall(false)

      if (error instanceof Error) {
        if (error.message.includes('media devices')) {
          alert('Please allow microphone access to use voice chat')
        } else if (error.message.includes('concurrency limit')) {
          alert(
            'You have reached your concurrency limit. Please stop other ongoing video sessions or upgrade your Beyond Presence plan.',
          )
        } else if (error.message.includes('Rate limit')) {
          // Extract wait time from error message
          const waitMatch = error.message.match(/(\d+)\s*seconds/)
          const waitTime = waitMatch ? waitMatch[1] : '60'
          alert(
            `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
          )
        } else if (
          error.message.includes('could not establish pc connection')
        ) {
          alert(
            'Network connectivity issue: Cannot establish WebRTC connection to LiveKit server. ' +
              'This prevents the avatar from joining. Check your internet connection and firewall settings.',
          )
        } else if (
          error.message.includes('Failed to connect to LiveKit room')
        ) {
          alert(
            'Cannot connect to video server. The Beyond Presence avatar cannot join without a stable connection. ' +
              'Please check your internet connection.',
          )
        } else {
          alert(`Failed to start video call: ${error.message}`)
        }
      } else {
        alert('Failed to start video call. Please try again.')
      }
    }
  }

  // Stop session
  const onStopSession = async () => {
    const currentSessionId = sessionData?.sessionId

    try {
      // Disconnect from LiveKit room
      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }

      // Close Beyond Presence session (fire and forget)
      if (currentSessionId) {
        closeBeyondPresenceSession(currentSessionId).catch((error) => {
          console.warn('Session cleanup failed (non-critical):', error)
        })
      }

      // Clean up state immediately
      setSessionData(null)
      setIsConnecting(false)
      setIsConnected(false)
      setIsVoiceChatActive(false)
      setIsVideoCall(false)

      if (videoRef.current) {
        // Clear all video elements
        while (videoRef.current.firstChild) {
          videoRef.current.removeChild(videoRef.current.firstChild)
        }
      }

      console.log('Session cleanup completed')
    } catch (error) {
      console.error('Error stopping Beyond Presence session:', error)
      // Still clean up local state even if API call fails
      setSessionData(null)
      setIsConnecting(false)
      setIsConnected(false)
      setIsVoiceChatActive(false)
    }
  }

  const handleVideoCallOn = async () => {
    // Prevent multiple simultaneous calls
    if (isConnecting || isVideoCall) {
      return
    }

    try {
      setIsVideoCall(true)
      await onStartSession()
    } catch (error) {
      console.error('Error in handleVideoCallOn:', error)
      setIsVideoCall(false)
      setIsConnecting(false)
    }
  }

  const handleVideoCallOff = () => {
    setIsVideoCall(false)
    onStopSession()
  }

  const handleMicrophoneSwitch = async () => {
    if (!roomRef.current || !isConnected) return

    try {
      if (isVoiceChatActive) {
        // Disable microphone
        const audioTrackPublications =
          roomRef.current.localParticipant.audioTrackPublications
        for (const [_, publication] of audioTrackPublications) {
          if (publication.track) {
            await roomRef.current.localParticipant.unpublishTrack(
              publication.track,
            )
          }
        }
        setIsVoiceChatActive(false)
      } else {
        // Enable microphone
        const hasAccess = await checkMicrophoneAccess()
        if (!hasAccess) {
          alert('Cannot start voice chat without microphone access')
          return
        }

        // Get user's microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })

        const audioTrack = stream.getAudioTracks()[0]
        if (audioTrack) {
          await roomRef.current.localParticipant.publishTrack(audioTrack, {
            source: Track.Source.Microphone,
          })
          setIsVoiceChatActive(true)
        }
      }
    } catch (error) {
      console.error('Error toggling microphone:', error)
      alert('Cannot toggle microphone without proper access')
    }
  }

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        onStopSession()
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
          disabled={isVideoCallDisabled || isConnecting}
          onClick={handleVideoCallOn}>
          <Video size={18} />
        </button>
      </Tooltip>
      {isVideoCall && (
        <div className={styles.callFrame}>
          <div className={styles.videoContainer}>
            <div ref={videoRef} className={styles.avatarVideo} />
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
