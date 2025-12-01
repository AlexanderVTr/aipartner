import { NextResponse } from 'next/server'

const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY
const BASE_API_URL = 'https://api.bey.dev/v1'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  if (!BEYOND_PRESENCE_API_KEY) {
    return NextResponse.json(
      { error: 'BEYOND_PRESENCE_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 },
      )
    }

    // Check if the session exists first (GET request)
    console.log('Checking session status before delete:', sessionId)
    const getResponse = await fetch(`${BASE_API_URL}/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
    })

    if (!getResponse.ok) {
      console.log('Session not found or already closed:', sessionId)
      return NextResponse.json(
        { message: 'Session already closed or not found' },
        { status: 200 },
      )
    }

    // Try to close the session - some APIs might not support DELETE
    const response = await fetch(`${BASE_API_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const status = response.status

      // 404 means session already closed or doesn't exist - that's okay
      // 405 means DELETE method not supported - sessions may auto-close on disconnect
      if (status === 404 || status === 405) {
        return NextResponse.json(
          {
            message:
              status === 405
                ? 'Session will auto-close on disconnect'
                : 'Session already closed or not found',
            autoClose: status === 405,
          },
          { status: 200 },
        )
      }

      throw new Error(
        errorData.message ||
          errorData.error ||
          `Failed to close session: ${response.statusText} (${status})`,
      )
    }

    return NextResponse.json({ success: true, message: 'Session closed' })
  } catch (error) {
    console.error('Error closing Beyond Presence session:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to close Beyond Presence session',
      },
      { status: 500 },
    )
  }
}
