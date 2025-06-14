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
