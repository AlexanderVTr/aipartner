// Helper function to format dates
export const formatMessageDate = (dateString: string) => {
  const messageDate = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // Reset time to compare only dates
  const messageDateOnly = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate(),
  )
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  const yesterdayOnly = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
  )

  if (messageDateOnly.getTime() === todayOnly.getTime()) {
    return 'Today'
  } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday'
  } else {
    return messageDate.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }
}
