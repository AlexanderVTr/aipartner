'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Video, VideoOff, Mic, MicOff } from 'lucide-react'
import styles from '../VideoCallButton/VideoCallButton.module.scss'
import { hedraConfig } from '@/lib/ai/Hedra/avatarConfig'
import { getHedraToken, createLiveKitRoom } from '@/lib/ai/Hedra/getToken'
import VideoCallStatus from '@/components/UI/VideoCallStatus/VideoCallStatus'
import { useTokens } from '@/contexts/TokensContext'
import Tooltip from '../UI/Tooltip/Tooltip'
import { TOOLTIP_CONTENT } from '@/constants/chat'
import { useRouter } from 'next/navigation'
import { Button } from '../UI'
import { checkMicrophoneAccess } from '@/helpers/helpers'

import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  TrackPublication,
} from 'livekit-client'

export default function HedraVideoCallButton() {
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isVideoCallDisabled, setIsVideoCallDisabled] = useState(true)
  const roomRef = useRef<Room | null>(null) // LiveKit Room instance
  const videoRef = useRef<HTMLVideoElement>(null)
  const isConnectedRef = useRef(false) // Track connection status for polling
  const connectionPromiseRef = useRef<{
    resolve: () => void
    reject: (error: Error) => void
  } | null>(null)
  const callStartTimeRef = useRef<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hedraToken, setHedraToken] = useState<string | undefined>(undefined)
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false)
  const [roomName, setRoomName] = useState<string>('')
  const [sessionActive, setSessionActive] = useState(false) // Track active session to prevent concurrency

  const { tokens, deductVideoCallTokens } = useTokens()
  const router = useRouter()

  useEffect(() => {
    setIsVideoCallDisabled(tokens <= 10)
  }, [tokens])

  // ROOM INITIALIZATION
  const onInitRoom = async (): Promise<void> => {
    if (!hedraToken || !roomName || !hedraConfig.livekitUrl) {
      console.error('Missing required configuration:', {
        hedraToken,
        roomName,
        livekitUrl: hedraConfig.livekitUrl,
      })
      return Promise.reject(new Error('Missing required configuration'))
    }

    return new Promise((resolve, reject) => {
      try {
        setIsConnecting(true)
        console.log('Initializing Hedra room:', roomName)

        // Create new Room instance
        const room = new Room()
        roomRef.current = room

        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 30000)

        // Handle room connection
        room.on(RoomEvent.Connected, () => {
          console.log('Connected to Hedra room')
          clearTimeout(connectionTimeout)
          isConnectedRef.current = true
          callStartTimeRef.current = Date.now()
          setIsConnected(true)
          setIsConnecting(false)

          // Check for existing participants (avatar might have joined before we connected)
          console.log(
            'Checking for existing participants:',
            room.remoteParticipants.size,
          )
          room.remoteParticipants.forEach((participant) => {
            console.log('Found existing participant:', participant.identity)
            console.log(
              'Participant video publications:',
              participant.videoTrackPublications.size,
            )

            participant.videoTrackPublications.forEach((publication) => {
              console.log('Existing video publication:', {
                trackSid: publication.trackSid,
                isSubscribed: publication.isSubscribed,
                track: !!publication.track,
              })

              if (publication.track && videoRef.current) {
                console.log(
                  'Attaching existing video track from',
                  participant.identity,
                )
                publication.track.attach(videoRef.current)
                videoRef.current.play().catch((error) => {
                  console.error('Error playing existing video track:', error)
                })
              }
            })

            // Also attach audio tracks
            participant.audioTrackPublications.forEach((publication) => {
              if (publication.track) {
                console.log(
                  'Attaching existing audio track from',
                  participant.identity,
                )
                const audioElement = publication.track.attach()
                audioElement.play().catch((error) => {
                  console.error('Error playing existing audio track:', error)
                })
              }
            })
          })

          if (room.remoteParticipants.size === 0) {
            console.warn(
              'No remote participants found. Avatar agent may not be running.',
            )
          }

          resolve()
          // Resolve any waiting connection promises (from handleVideoCallOn)
          if (connectionPromiseRef.current) {
            console.log('Resolving waiting connection promise')
            connectionPromiseRef.current.resolve()
            connectionPromiseRef.current = null
          }
        })

        // Handle room disconnection
        room.on(RoomEvent.Disconnected, () => {
          console.log('Disconnected from Hedra room')
          isConnectedRef.current = false
          setIsConnected(false)
          setIsConnecting(false)
        })

        // Handle connection errors
        room.on(RoomEvent.Reconnecting, () => {
          console.log('Reconnecting to Hedra room...')
        })

        // Handle remote participant joining (avatar)
        room.on(
          RoomEvent.ParticipantConnected,
          (participant: RemoteParticipant) => {
            console.log('Participant connected:', participant.identity)
            console.log('Participant tracks:', {
              videoTracks: Array.from(
                participant.videoTrackPublications.values(),
              ).map((pub) => ({
                trackSid: pub.trackSid,
                isSubscribed: pub.isSubscribed,
                kind: pub.kind,
              })),
              audioTracks: Array.from(
                participant.audioTrackPublications.values(),
              ).map((pub) => ({
                trackSid: pub.trackSid,
                isSubscribed: pub.isSubscribed,
                kind: pub.kind,
              })),
            })

            // Check if this participant has video tracks and attach them
            console.log(
              'Participant video publications:',
              participant.videoTrackPublications.size,
            )
            participant.videoTrackPublications.forEach((publication) => {
              console.log('Video publication:', {
                trackSid: publication.trackSid,
                isSubscribed: publication.isSubscribed,
                track: !!publication.track,
              })

              if (publication.track && videoRef.current) {
                console.log('Attaching video track from', participant.identity)
                publication.track.attach(videoRef.current)
                videoRef.current.play().catch((error) => {
                  console.error('Error playing video:', error)
                })
              }
            })

            // Also attach audio tracks
            participant.audioTrackPublications.forEach((publication) => {
              if (publication.track) {
                console.log('Attaching audio track from', participant.identity)
                const audioElement = publication.track.attach()
                audioElement.play().catch((error) => {
                  console.error('Error playing audio:', error)
                })
              }
            })
          },
        )

        // Handle participant disconnection
        room.on(
          RoomEvent.ParticipantDisconnected,
          (participant: RemoteParticipant) => {
            console.log('Participant disconnected:', participant.identity)
            // Detach tracks when participant leaves
            participant.videoTrackPublications.forEach((publication) => {
              if (publication.track && videoRef.current) {
                publication.track.detach(videoRef.current)
              }
            })
          },
        )

        // Handle track subscriptions - this is where we get the avatar video
        room.on(
          RoomEvent.TrackSubscribed,
          (
            track: RemoteTrack,
            publication: TrackPublication,
            participant: RemoteParticipant,
          ) => {
            console.log(
              'Track subscribed:',
              track.kind,
              'from',
              participant.identity,
              {
                trackSid: track.sid,
                isMuted: track.isMuted,
              },
            )

            if (track.kind === Track.Kind.Video && videoRef.current) {
              // Attach video track to video element
              console.log('Attaching subscribed video track to element')
              track.attach(videoRef.current)
              videoRef.current.play().catch((error) => {
                console.error('Error playing video:', error)
              })
              console.log('Video track attached and playing')
            } else if (track.kind === Track.Kind.Audio) {
              // Attach audio track to a new audio element for playback
              console.log('Attaching audio track for playback')
              const audioElement = track.attach()
              audioElement.play().catch((error) => {
                console.error('Error playing audio:', error)
              })
              console.log('Audio track attached and playing')
            }
          },
        )

        // Handle track unsubscription
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          console.log('Track unsubscribed:', track.kind)
          if (videoRef.current) {
            track.detach(videoRef.current)
          }
        })

        // Handle track publications (when tracks are published but not yet subscribed)
        room.on(
          RoomEvent.TrackPublished,
          (publication: TrackPublication, participant: RemoteParticipant) => {
            console.log('Track published:', {
              kind: publication.kind,
              trackSid: publication.trackSid,
              participant: participant.identity,
              isSubscribed: publication.isSubscribed,
            })

            // LiveKit auto-subscribes to tracks by default
            // TrackSubscribed event will fire when subscription completes
            if (publication.kind === Track.Kind.Video) {
              console.log('Video track published, waiting for subscription...')
            }
          },
        )

        // Handle errors
        room.on(RoomEvent.RoomMetadataChanged, (metadata: string) => {
          console.log('Room metadata changed:', metadata)
        })

        // Connect to LiveKit room
        room.connect(hedraConfig.livekitUrl!, hedraToken).catch((error) => {
          clearTimeout(connectionTimeout)
          console.error('Error connecting to Hedra room:', error)
          setIsConnecting(false)
          setIsConnected(false)
          roomRef.current = null
          // Reject any waiting connection promises
          if (connectionPromiseRef.current) {
            connectionPromiseRef.current.reject(error)
            connectionPromiseRef.current = null
          }
          reject(error)
        })
        console.log('Room connection initiated')
      } catch (error) {
        console.error('Error initializing Hedra room:', error)
        setIsConnecting(false)
        setIsConnected(false)
        if (roomRef.current) {
          roomRef.current = null
        }
        reject(error)
      }
    })
  }

  // AVATAR START
  const onStartAvatar = async (currentRoomName?: string) => {
    const activeRoomName = currentRoomName || roomName
    // Wait a bit if connection ref isn't set yet (microtask delay)
    if (!isConnectedRef.current && roomRef.current) {
      console.log('Waiting for connection ref to be set...', {
        roomState: roomRef.current.state,
      })
      // Check room state directly as fallback
      if (roomRef.current.state === 'connected') {
        isConnectedRef.current = true
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    // Check both ref and room state
    const isRoomConnected =
      isConnectedRef.current || roomRef.current?.state === 'connected'

    if (!roomRef.current || !isRoomConnected) {
      console.log('Room not ready, waiting for connection...', {
        hasRoom: !!roomRef.current,
        isConnectedRef: isConnectedRef.current,
        roomState: roomRef.current?.state,
      })
      return
    }

    try {
      // Avatar ID is handled server-side via room metadata
      // The agent will read it from room metadata or environment
      // No need to call start-avatar API - the agent auto-joins rooms
      console.log('Waiting for Hedra avatar agent to join room...')

      // Check microphone access before starting voice chat
      const hasAccess = await checkMicrophoneAccess()
      if (!hasAccess) {
        throw new Error('Cannot start voice chat without media devices')
      }

      // Enable microphone track for voice chat
      await roomRef.current.localParticipant.setMicrophoneEnabled(true)
      setIsVoiceChatActive(true)
      console.log('Microphone enabled for Hedra voice chat')

      // The Hedra avatar should join the room and start publishing video tracks
      console.log(
        'Hedra avatar session ready - waiting for avatar to join room',
      )
    } catch (error) {
      console.error('Error starting Hedra avatar:', error)
      if (error instanceof Error && error.message.includes('media devices')) {
        alert('Please allow microphone access to use voice chat')
      }
    }
  }

  // AVATAR STOP
  const onStopAvatar = async () => {
    if (!roomRef.current) return
    try {
      // Detach all tracks from video element
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      // Disconnect from room
      await roomRef.current.disconnect()
      isConnectedRef.current = false
      setIsConnecting(false)
      setIsConnected(false)
      roomRef.current = null
      connectionPromiseRef.current = null
      console.log('Disconnected from Hedra room')
    } catch (error) {
      console.error('Error stopping Hedra avatar:', error)
      // Force cleanup even if there was an error
      isConnectedRef.current = false
      roomRef.current = null
      setIsConnecting(false)
      setIsConnected(false)
      connectionPromiseRef.current = null
    }
  }

  const handleVideoCallOn = async () => {
    try {
      // Prevent concurrent sessions
      if (sessionActive) {
        console.warn('Session already active, cannot start new session')
        alert(
          'A video call session is already active. Please end the current session first.',
        )
        return
      }

      setSessionActive(true)

      // Create LiveKit room - the server will use HEDRA_AVATAR_ID from environment
      // The avatar ID will be passed as room metadata for the agent
      const roomData = await createLiveKitRoom()
      setRoomName(roomData.roomName)

      // Get token for the room
      const newToken = await getHedraToken(roomData.roomName)
      setHedraToken(newToken)

      setIsVideoCall(true)

      // Room will be initialized via useEffect when hedraToken and roomName are set
      // Wait for room to be connected (onInitRoom will be called by useEffect)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              'Connection timeout - room did not connect within 30 seconds',
            ),
          )
        }, 30000)

        connectionPromiseRef.current = {
          resolve: () => {
            clearTimeout(timeout)
            resolve()
          },
          reject: (error: Error) => {
            clearTimeout(timeout)
            reject(error)
          },
        }

        // Poll for connection status
        const checkConnection = () => {
          if (isConnectedRef.current && roomRef.current) {
            clearTimeout(timeout)
            if (connectionPromiseRef.current) {
              connectionPromiseRef.current.resolve()
              connectionPromiseRef.current = null
            }
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        // Start checking after a short delay to allow useEffect to trigger
        setTimeout(checkConnection, 500)
      }).catch((error) => {
        console.error('Error waiting for connection:', error)
        setSessionActive(false)
        setIsVideoCall(false)
        setIsConnecting(false)
        connectionPromiseRef.current = null
        alert('Failed to connect to room. Please try again.')
        throw error
      })

      await onStartAvatar(roomData.roomName)
    } catch (error) {
      console.error('Error in handleVideoCallOn:', error)
      setSessionActive(false) // Reset session state on error
      setIsVideoCall(false)
      setIsConnecting(false)
      connectionPromiseRef.current = null
    }
  }

  const handleVideoCallOff = async () => {
    try {
      console.log('Closing Hedra session...')

      if (callStartTimeRef.current !== null) {
        const durationMs = Date.now() - callStartTimeRef.current
        const durationMinutes = durationMs / 60000
        if (durationMinutes > 0) {
          await deductVideoCallTokens(durationMinutes)
        }
        callStartTimeRef.current = null
      }

      // Stop the avatar and disconnect from room
      await onStopAvatar()

      // Reset all states
      setIsVideoCall(false)
      setIsConnected(false)
      setIsConnecting(false)
      setIsVoiceChatActive(false)
      setHedraToken(undefined)
      setRoomName('')
      setSessionActive(false)

      console.log('Hedra session closed successfully')
    } catch (error) {
      console.error('Error closing Hedra session:', error)
      // Force cleanup even if there was an error
      setSessionActive(false)
      setIsVideoCall(false)
      setIsConnected(false)
      setIsConnecting(false)
      setIsVoiceChatActive(false)
      setHedraToken(undefined)
      setRoomName('')
    }
  }

  const handleMicrophoneSwitch = async () => {
    if (!roomRef.current || !isConnected) return

    if (isVoiceChatActive) {
      // Disable microphone
      await roomRef.current.localParticipant.setMicrophoneEnabled(false)
      setIsVoiceChatActive(false)
    } else {
      try {
        const hasAccess = await checkMicrophoneAccess()
        if (!hasAccess) {
          alert('Cannot start voice chat without microphone access')
          return
        }

        // Enable microphone
        await roomRef.current.localParticipant.setMicrophoneEnabled(true)
        setIsVoiceChatActive(true)
      } catch (error) {
        console.error('Error starting voice chat:', error)
        alert('Cannot start voice chat without microphone access')
      }
    }
  }

  useEffect(() => {
    if (hedraToken && roomName) {
      onInitRoom()
    }
  }, [hedraToken, roomName])

  useEffect(() => {
    return () => {
      if (callStartTimeRef.current !== null) {
        const durationMinutes =
          (Date.now() - callStartTimeRef.current) / 60000
        if (durationMinutes > 0) {
          deductVideoCallTokens(durationMinutes)
        }
        callStartTimeRef.current = null
      }
      if (roomRef.current) {
        onStopAvatar()
      }
      setSessionActive(false)
    }
  }, [])

  // Additional effect to handle page visibility changes (user switching tabs/closing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionActive) {
        console.log('Page hidden with active session, cleaning up...')
        handleVideoCallOff()
      }
    }

    const handleBeforeUnload = () => {
      if (sessionActive) {
        console.log('Page unloading with active session, cleaning up...')
        // Synchronous cleanup for page unload
        if (roomRef.current) {
          try {
            roomRef.current.disconnect()
          } catch (error) {
            console.error('Error during page unload cleanup:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [sessionActive])

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
          className={`${styles.button} ${isVideoCall ? styles.buttonOn : ''} ${isConnecting ? styles.buttonConnecting : ''}`}
          disabled={isVideoCallDisabled || sessionActive || isConnecting}
          onClick={handleVideoCallOn}
          title={
            sessionActive
              ? 'Video call session active - click hangup button to end'
              : isConnecting
                ? 'Connecting...'
                : 'Start video call'
          }>
          {isConnecting ? (
            <div className={styles.spinner} />
          ) : (
            <Video size={18} />
          )}
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
