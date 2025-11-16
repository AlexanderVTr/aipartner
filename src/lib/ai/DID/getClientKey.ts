export const getClientKey = async () => {
  try {
    const response = await fetch('/api/did/client-key', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to get D-ID client key')
    }

    const data = await response.json()
    return data.clientKey
  } catch (error) {
    console.error('Error getting D-ID client key:', error)
    throw error
  }
}

