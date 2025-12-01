export const closeBeyondPresenceSession = async (
  sessionId: string,
): Promise<void> => {
  try {
    const response = await fetch(`/api/beyond-presence/session/${sessionId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // Don't throw if session is already closed (404) or method not allowed (405)
      // 405 means DELETE not supported - sessions may auto-close on disconnect
      if (response.status !== 404 && response.status !== 405) {
        throw new Error(
          errorData.error || errorData.message || 'Failed to close session',
        )
      }
    }
  } catch (error) {
    console.error('Error closing Beyond Presence session:', error)
    // Don't throw - session cleanup is best effort
  }
}
