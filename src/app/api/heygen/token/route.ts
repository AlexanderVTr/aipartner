import { NextResponse } from 'next/server'

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL_HEYGEN

export async function POST() {
  if (!HEYGEN_API_KEY) {
    return NextResponse.json(
      { error: 'HEYGEN_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const response = await fetch(`${BASE_API_URL}/v1/streaming.create_token`, {
      method: 'POST',
      headers: {
        'x-api-key': HEYGEN_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get HeyGen token')
    }

    const data = await response.json()
    return NextResponse.json({ token: data.data.token })
  } catch (error) {
    console.error('Error getting HeyGen token:', error)
    return NextResponse.json(
      { error: 'Failed to get HeyGen token' },
      { status: 500 },
    )
  }
}
