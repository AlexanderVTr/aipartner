export const getHedraToken = async (roomName?: string) => {
  try {
    const response = await fetch('/api/hedra/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName }),
    })

    if (!response.ok) {
      throw new Error('Failed to get Hedra token')
    }

    const data = await response.json()
    const newToken = data.token
    return newToken
  } catch (error) {
    console.error('Error getting Hedra token:', error)
    throw error
  }
}

export const createLiveKitRoom = async () => {
  try {
    const response = await fetch('/api/hedra/room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to create LiveKit room')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating LiveKit room:', error)
    throw error
  }
}
