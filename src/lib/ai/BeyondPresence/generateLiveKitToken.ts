import { AccessToken } from 'livekit-server-sdk'

export interface LiveKitTokenOptions {
  roomName: string
  participantName: string
  apiKey: string
  apiSecret: string
}

/**
 * Generate a LiveKit access token for joining a room
 * This token is required for Beyond Presence session creation
 */
export function generateLiveKitToken({
  roomName,
  participantName,
  apiKey,
  apiSecret,
}: LiveKitTokenOptions): string {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  return at.toJwt()
}
