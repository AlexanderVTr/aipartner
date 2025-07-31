export const getToken = async () => {
  try {
    const response = await fetch('/api/heygen/token', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to get token')
    }

    const data = await response.json()
    const newToken = data.token
    return newToken
  } catch (error) {
    console.error('Error getting HeyGen token:', error)
    throw error
  }
}
