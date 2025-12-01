export interface BeyondPresenceSessionResponse {
  id: string
  session_id?: string
  avatar_id: string
  url: string
  started_at: string
  transport: string
  livekit?: {
    url: string
    token: string
    room: string
  }
  [key: string]: unknown
}

export const getBeyondPresenceSession = async (
  avatarId: string,
): Promise<BeyondPresenceSessionResponse> => {
  try {
    const response = await fetch('/api/beyond-presence/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatarId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const status = response.status

      // Handle specific error cases
      if (status === 429) {
        const retryAfter = errorData.retryAfter || '60'
        throw new Error(
          `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
        )
      }

      throw new Error(
        errorData.error ||
          errorData.message ||
          `Failed to create session (${status})`,
      )
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting Beyond Presence session:', error)
    throw error
  }
}
