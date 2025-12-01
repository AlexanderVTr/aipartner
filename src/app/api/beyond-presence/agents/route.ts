import { NextResponse } from 'next/server'

const BEYOND_PRESENCE_API_KEY = process.env.BEYOND_PRESENCE_API_KEY
const BASE_API_URL = 'https://api.bey.dev/v1'

export async function GET() {
  if (!BEYOND_PRESENCE_API_KEY) {
    return NextResponse.json(
      { error: 'BEYOND_PRESENCE_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const response = await fetch(`${BASE_API_URL}/agents`, {
      method: 'GET',
      headers: {
        'x-api-key': BEYOND_PRESENCE_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch agents')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Beyond Presence agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 },
    )
  }
}

