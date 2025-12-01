import { NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY
const LIVEKIT_URL = process.env.LIVEKIT_URL
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
const BASE_API_URL = 'https://api.bey.dev/v1'

async function generateLiveKitToken(
  roomName: string,
  participantName: string,
): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit API key and secret are required')
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
  })

  // IMPORTANT: This token is used by BOTH the user AND the Beyond Presence agent
  // The agent will use the same token to join the room
  at.addGrant({
    room: roomName,
    roomJoin: true,
    roomCreate: true,
    canPublish: true, // Agent needs to publish video/audio
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  })

  return await at.toJwt()
}

export async function POST(request: Request) {
  if (!BEYOND_PRESENCE_API_KEY) {
    return NextResponse.json(
      { error: 'BEYOND_PRESENCE_API_KEY is not configured' },
      { status: 500 },
    )
  }

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return NextResponse.json(
      {
        error:
          'LiveKit configuration is missing. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET environment variables.',
      },
      { status: 500 },
    )
  }

  try {
    const body = await request.json()
    const { avatarId } = body

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatarId is required' },
        { status: 400 },
      )
    }

    // Generate a unique room name for this session
    const roomName = `beyond-presence-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const participantName = `user-${Date.now()}`

    // Generate LiveKit token for the session
    const liveKitToken = await generateLiveKitToken(roomName, participantName)

    // Create a speech-to-video session with Beyond Presence
    const response = await fetch(`${BASE_API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        url: LIVEKIT_URL,
        token: liveKitToken,
        transport: 'livekit',
        // Add additional parameters that might be required
        language: 'en', // Required parameter
        // knowledge_base: beyondPresenceConfig.knowledgeBase, // Optional
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const statusText = response.statusText
      const status = response.status
      const errorMessage = errorData.message || errorData.error || statusText

      // Handle concurrency limit
      if (
        errorMessage.includes('concurrency limit') ||
        errorMessage.includes('concurrent sessions')
      ) {
        return NextResponse.json(
          {
            error:
              'You have reached your concurrency limit. Please stop other ongoing video sessions or upgrade your Beyond Presence plan.',
            type: 'concurrency_limit',
          },
          { status: 403 },
        )
      }

      // Handle rate limiting
      if (status === 429) {
        const retryAfterHeader = response.headers.get('retry-after')
        const retryAfter = retryAfterHeader
          ? parseInt(retryAfterHeader, 10)
          : 300 // Default to 5 minutes if not specified

        console.error('Beyond Presence rate limit:', {
          retryAfter,
          retryAfterHeader,
          status,
          errorData,
        })

        return NextResponse.json(
          {
            error: `Rate limit exceeded. Please wait ${retryAfter} seconds (${Math.ceil(retryAfter / 60)} minutes) before trying again.`,
            retryAfter: retryAfter.toString(),
            type: 'rate_limit',
          },
          { status: 429 },
        )
      }

      throw new Error(
        errorMessage || `Failed to create session: ${statusText} (${status})`,
      )
    }

    const data = await response.json()

    console.log('Beyond Presence session created successfully:', {
      sessionId: data.id || data.session_id,
      avatarId: data.avatar_id,
      transport: data.transport,
      status: data.status,
      startedAt: data.started_at,
      url: data.url,
    })

    // Return session data along with LiveKit connection info for the client
    return NextResponse.json({
      ...data,
      livekit: {
        url: LIVEKIT_URL,
        token: liveKitToken,
        room: roomName,
      },
    })
  } catch (error) {
    console.error('Error creating Beyond Presence session:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create Beyond Presence session',
      },
      { status: 500 },
    )
  }
}
