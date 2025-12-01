import { NextResponse } from 'next/server'

const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY
const BASE_API_URL = 'https://api.bey.dev/v1'

export async function GET(request: Request) {
  if (!BEYOND_PRESENCE_API_KEY) {
    return NextResponse.json(
      { error: 'BEYOND_PRESENCE_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 },
      )
    }

    // Get session status from Beyond Presence
    console.log('Checking session status:', sessionId)
    const response = await fetch(`${BASE_API_URL}/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Session status check failed:', {
        sessionId,
        status: response.status,
        error: errorData,
      })

      return NextResponse.json(
        {
          sessionId,
          status: 'error',
          error: errorData.message || 'Failed to get session status',
          httpStatus: response.status,
        },
        { status: response.status },
      )
    }

    const sessionData = await response.json()
    console.log('Beyond Presence session status response:', {
      sessionId,
      rawResponse: sessionData,
      status: sessionData.status,
      avatar_id: sessionData.avatar_id,
      transport: sessionData.transport,
      started_at: sessionData.started_at,
      url: sessionData.url,
      error: sessionData.error,
    })

    return NextResponse.json({
      sessionId,
      status: 'active',
      sessionData,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error checking session status:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check session status',
      },
      { status: 500 },
    )
  }
}
