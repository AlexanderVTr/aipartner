import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL

export async function POST(request: NextRequest) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return NextResponse.json(
      { error: 'LiveKit configuration is not complete' },
      { status: 500 },
    )
  }

  try {
    const roomService = new RoomServiceClient(
      LIVEKIT_URL.replace('wss://', 'https://'),
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
    )

    const roomName = `hedra-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Get avatar ID from environment variable (must be pre-created in Hedra Studio)
    const avatarId = process.env.HEDRA_AVATAR_ID

    if (!avatarId) {
      return NextResponse.json(
        {
          error: 'HEDRA_AVATAR_ID is not configured',
          message:
            'Please set HEDRA_AVATAR_ID in your environment variables with a pre-created avatar UUID from Hedra Studio.',
        },
        { status: 500 },
      )
    }

    // Create the room with LiveKit
    // Set metadata with avatar ID so the agent knows which avatar to use
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 10 * 60, // 10 minutes
      maxParticipants: 10,
      metadata: avatarId, // Pass avatar ID as metadata
    })

    console.log('LiveKit room created:', roomName)

    return NextResponse.json({
      roomName,
      roomUrl: `${LIVEKIT_URL}/room/${roomName}`,
    })
  } catch (error) {
    console.error('Error creating LiveKit room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 },
    )
  }
}
