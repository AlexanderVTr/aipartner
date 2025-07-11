import { ChatMessage } from '@/lib/ai/callOpenAi'
import { RefObject } from 'react'

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

// Helper function to check if we should show date divider
export const shouldShowDateDivider = (
  currentMessage: ChatMessage,
  previousMessage: ChatMessage,
) => {
  // If no created_at, it's a new message - don't show divider
  if (!currentMessage.created_at) {
    return false
  }

  const currentDate = new Date(currentMessage.created_at).toDateString()
  const today = new Date().toDateString()

  // Never show divider for today's messages
  if (currentDate === today) {
    return false
  }

  // For first message that's not today - show divider
  if (!previousMessage) {
    return true
  }

  // If previous message has no created_at, it's today - show divider for non-today message
  if (!previousMessage.created_at) {
    return true
  }

  // Both messages have dates - show divider if dates are different
  const previousDate = new Date(previousMessage.created_at).toDateString()
  return currentDate !== previousDate
}
