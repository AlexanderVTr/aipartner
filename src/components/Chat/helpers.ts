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

export interface MessageGroup {
  date: string
  dateLabel: string
  messages: ExtendedChatMessage[]
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

// Generate a unique key for a message
export const generateMessageKey = (
  message: ExtendedChatMessage,
  index: number,
): string => {
  if (message.id) {
    return message.id
  }
  // For messages without database ID, create a simple hash without btoa
  const text = message.content + message.role
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `${index}-${message.role}-${Math.abs(hash).toString(36)}`
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

// Group messages by date
export const groupMessagesByDate = (
  messages: ExtendedChatMessage[],
): MessageGroup[] => {
  const groups: { [key: string]: MessageGroup } = {}

  messages.forEach((message) => {
    const messageDate = message.timestamp
      ? new Date(message.timestamp)
      : new Date() // For new messages without timestamp

    const dateKey = messageDate.toDateString()

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        dateLabel: formatDateLabel(messageDate),
        messages: [],
      }
    }

    groups[dateKey].messages.push(message)
  })

  // Sort groups by date (oldest first)
  return Object.values(groups).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
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
