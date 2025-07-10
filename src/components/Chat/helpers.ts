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
  if (!previousMessage) return true

  const currentDate = new Date(currentMessage.created_at || '').toDateString()
  const previousDate = new Date(previousMessage.created_at || '').toDateString()
  const today = new Date().toDateString()

  // Skip today's messages
  if (currentDate === today) {
    return false
  }

  return currentDate !== previousDate
}
