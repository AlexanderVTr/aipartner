import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
const HEDRA_API_KEY = process.env.HEDRA_API_KEY

export async function POST(request: NextRequest) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return NextResponse.json(
      { error: 'LIVEKIT_API_KEY and LIVEKIT_API_SECRET are not configured' },
      { status: 500 },
    )
  }

  if (!HEDRA_API_KEY) {
    return NextResponse.json(
      { error: 'HEDRA_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const roomName =
      body.roomName ||
      `hedra-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const participantName = body.participantName || `user-${Date.now()}`

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
    })

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    // Generate JWT token
    const token = await at.toJwt()

    return NextResponse.json({
      token,
      roomName,
    })
  } catch (error) {
    console.error('Error generating Hedra token:', error)
    return NextResponse.json(
      { error: 'Failed to generate Hedra token' },
      { status: 500 },
    )
  }
}
