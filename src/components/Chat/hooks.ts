import { useState, useCallback, useEffect, RefObject } from 'react'
import { useUser } from '@clerk/nextjs'
import { getMessagesPaginated } from '@/lib/History/History.service'
import {
  ExtendedChatMessage,
  formatDatabaseMessages,
  canScrollDown,
} from './helpers'
import { CHAT_CONFIG } from './constants'

// Hook for managing message history
export const useMessageHistory = () => {
  const { user } = useUser()
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const [historyOffset, setHistoryOffset] = useState(0)

  // Load initial history
  const loadInitialHistory = useCallback(async () => {
    if (!user) return []

    setIsLoadingHistory(true)
    try {
      const result = await getMessagesPaginated(
        CHAT_CONFIG.INITIAL_HISTORY_LIMIT,
        0,
      )

      const formattedMessages = formatDatabaseMessages(result.messages)
      setMessages(formattedMessages)
      setHistoryOffset(result.messages.length)
      setHasMoreHistory(result.hasMore)

      return formattedMessages
    } catch (error) {
      console.error('Error loading initial history:', error)
      return []
    } finally {
      setIsLoadingHistory(false)
    }
  }, [user])

  // Load more messages for infinite scroll
  const loadMoreMessages = useCallback(async () => {
    if (!user || isLoadingMore || !hasMoreHistory) return

    setIsLoadingMore(true)
    try {
      const result = await getMessagesPaginated(
        CHAT_CONFIG.PAGINATION_LIMIT,
        historyOffset,
      )

      const formattedMessages = formatDatabaseMessages(result.messages)

      // Prepend older messages to the beginning
      setMessages((prev) => [...formattedMessages, ...prev])
      setHistoryOffset((prev) => prev + result.messages.length)
      setHasMoreHistory(result.hasMore)
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [user, isLoadingMore, hasMoreHistory, historyOffset])

  // Add a new message to the end
  const addMessage = useCallback((message: ExtendedChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  return {
    messages,
    isLoadingHistory,
    isLoadingMore,
    hasMoreHistory,
    loadInitialHistory,
    loadMoreMessages,
    addMessage,
  }
}

// Hook for scroll button visibility
export const useScrollButton = (
  containerRef: RefObject<HTMLDivElement | null>,
) => {
  const [showScrollButton, setShowScrollButton] = useState(false)

  const updateScrollButton = useCallback(() => {
    const shouldShow = canScrollDown(containerRef)
    setShowScrollButton(shouldShow)
  }, [containerRef])

  return {
    showScrollButton,
    updateScrollButton,
  }
}

// Hook for infinite scroll
export const useInfiniteScroll = (
  containerRef: RefObject<HTMLDivElement | null>,
  hasMoreHistory: boolean,
  isLoadingMore: boolean,
  onLoadMore: () => void,
) => {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Check if scrolled to top and more history is available
      if (container.scrollTop === 0 && hasMoreHistory && !isLoadingMore) {
        onLoadMore()
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreHistory, isLoadingMore, onLoadMore])
}
