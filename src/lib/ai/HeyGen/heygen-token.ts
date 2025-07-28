'use server'
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY
const BASE_API_URL =
  process.env.NEXT_PUBLIC_BASE_API_URL_HEYGEN || 'https://api.heygen.ai/v1'

export async function getHeyGenToken() {
  if (!HEYGEN_API_KEY) {
    throw new Error('HEYGEN_API_KEY is not configured')
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
    return data.data.token
  } catch (error) {
    console.error('Error getting HeyGen token:', error)
    throw error
  }
}
