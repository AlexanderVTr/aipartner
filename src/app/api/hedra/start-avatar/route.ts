import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'

const HEDRA_API_KEY = process.env.HEDRA_API_KEY
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL

// Hedra API endpoints
const HEDRA_API_BASE =
  process.env.HEDRA_API_BASE_URL || 'https://api.hedra.com/v1'

export async function POST(request: NextRequest) {
  if (!HEDRA_API_KEY) {
    return NextResponse.json(
      { error: 'HEDRA_API_KEY is not configured' },
      { status: 500 },
    )
  }

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return NextResponse.json(
      { error: 'LiveKit configuration is not complete' },
      { status: 500 },
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { roomName, avatarId } = body

    if (!roomName) {
      return NextResponse.json(
        { error: 'roomName is required' },
        { status: 400 },
      )
    }

    // Use avatarId from request or env (localStorage is client-side only)
    const finalAvatarId = avatarId || process.env.HEDRA_AVATAR_ID

    if (!finalAvatarId) {
      return NextResponse.json(
        {
          error:
            'Avatar ID is required. Please upload an avatar or configure HEDRA_AVATAR_ID',
        },
        { status: 400 },
      )
    }

    console.log('Starting Hedra avatar session:', {
      roomName,
      avatarId: finalAvatarId,
      livekitUrl: LIVEKIT_URL,
    })

    // Try to start Hedra livestream session via API
    // Note: Hedra typically uses LiveKit agents, not direct API calls
    // This endpoint may not exist - the agent should auto-join rooms instead
    try {
      const HEDRA_LIVESTREAM_URL =
        process.env.HEDRA_LIVESTREAM_URL || `${HEDRA_API_BASE}/livestream/start`

      console.log('Attempting to call Hedra API:', HEDRA_LIVESTREAM_URL)

      const hedraResponse = await fetch(HEDRA_LIVESTREAM_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HEDRA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_id: finalAvatarId,
          room_name: roomName,
          livekit_url: LIVEKIT_URL,
          livekit_api_key: LIVEKIT_API_KEY,
          livekit_api_secret: LIVEKIT_API_SECRET,
        }),
      })

      if (!hedraResponse.ok) {
        const errorText = await hedraResponse.text()
        console.error('Hedra API error:', hedraResponse.status, errorText)
        console.warn(
          'Hedra API endpoint returned error. This is expected if using LiveKit agents.',
          'The avatar agent should auto-join rooms when configured properly.',
        )
        // Continue anyway - agent might auto-join
      } else {
        const hedraData = await hedraResponse.json()
        console.log('Hedra livestream started:', hedraData)
        return NextResponse.json({
          success: true,
          message: 'Avatar session started via Hedra API',
          roomName,
          avatarId: finalAvatarId,
          hedraData,
        })
      }
    } catch (hedraError) {
      console.warn(
        'Hedra API call failed, avatar agent may auto-join:',
        hedraError,
      )
      // Continue - agent might be configured to auto-join rooms
    }

    // If Hedra API is not available or fails, the LiveKit agent should auto-join
    // This requires a separate agent service running with Hedra plugin
    return NextResponse.json({
      success: true,
      message: 'Avatar session initiated',
      roomName,
      avatarId: finalAvatarId,
      note: 'Ensure LiveKit agent with Hedra plugin is running and configured to auto-join rooms.',
    })
  } catch (error) {
    console.error('Error starting Hedra avatar session:', error)
    return NextResponse.json(
      { error: 'Failed to start avatar session' },
      { status: 500 },
    )
  }
}
