import { RefObject } from 'react'

export interface ExtendedChatMessage {
  role: 'user' | 'assistant'
  content: string
  id?: string
  timestamp?: string
}

export interface DatabaseMessage {
  id: string
  user_id: string
  role: string
  content: string
  created_at: string
}

// Simple scroll functions
export const scrollToBottom = (
  containerRef: RefObject<HTMLDivElement | null>,
) => {
  const container = containerRef.current
  if (container) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }
}

export const canScrollDown = (
  containerRef: RefObject<HTMLDivElement | null>,
): boolean => {
  const container = containerRef.current
  if (!container) return false

  const { scrollTop, scrollHeight, clientHeight } = container
  // Add a small threshold (5px) to account for rounding errors
  return scrollTop + clientHeight < scrollHeight - 5
}

export const handleKeyDown = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  onSubmit: () => void,
) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSubmit()
  }
}

// Format date for display
export const formatDateLabel = (date: Date): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }

  // Check if it's yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  // Format as "Thu 8 Jul" for other dates
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// Check if two messages are from different days
export const shouldShowDateSeparator = (
  currentMessage: ExtendedChatMessage,
  previousMessage?: ExtendedChatMessage,
): boolean => {
  if (!previousMessage) return true // Show separator for first message

  const currentDate = currentMessage.timestamp
    ? new Date(currentMessage.timestamp)
    : new Date()
  const previousDate = previousMessage.timestamp
    ? new Date(previousMessage.timestamp)
    : new Date()

  return currentDate.toDateString() !== previousDate.toDateString()
}

// Convert database messages to ExtendedChatMessage format
export const formatDatabaseMessages = (
  historyMessages: DatabaseMessage[],
): ExtendedChatMessage[] => {
  return historyMessages.map((msg: DatabaseMessage) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    id: msg.id,
    timestamp: msg.created_at,
  }))
}

// Create a new message with timestamp
export const createMessage = (
  role: 'user' | 'assistant',
  content: string,
): ExtendedChatMessage => ({
  role,
  content,
  timestamp: new Date().toISOString(),
})
