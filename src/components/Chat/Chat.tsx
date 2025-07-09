'use client'

import Header from '@/components/Header/Header'
import { Button } from '@/components/UI'
import callOpenAi from '@/lib/ai/callOpenAi'
import { useRef, useState, useEffect, useCallback } from 'react'
import styles from './Chat.module.scss'
import { ArrowUpFromDot, ArrowDown } from 'lucide-react'
import {
  handleKeyDown,
  createMessage,
  scrollToBottom,
  formatDateLabel,
  shouldShowDateSeparator,
} from './helpers'
import { CHAT_MESSAGES, CHAT_ROLES } from '@/constants/chat'
import { CHAT_CONFIG } from './constants'
import { useMessageHistory, useScrollButton, useInfiniteScroll } from './hooks'
import { useRouter } from 'next/navigation'
import { useTokens } from '@/contexts/TokensContext'
import {
  findSimilarMessages,
  saveMessageToDB,
} from '@/lib/History/History.service'
import { useUser } from '@clerk/nextjs'

interface Message {
  role: string
  content: string
}

export default function Chat() {
  const router = useRouter()
  const { tokens, decrementTokens } = useTokens()
  const { user } = useUser()
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // State
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Custom hooks
  const {
    messages,
    isLoadingHistory,
    isLoadingMore,
    hasMoreHistory,
    loadInitialHistory,
    loadMoreMessages,
    addMessage,
  } = useMessageHistory()

  const { showScrollButton, updateScrollButton } =
    useScrollButton(messagesContainerRef)

  // Auto-scroll to bottom with delay
  const autoScrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollToBottom(messagesContainerRef)
    }, CHAT_CONFIG.SCROLL_DELAY)
  }, [])

  // Load initial history on mount
  useEffect(() => {
    const initializeHistory = async () => {
      const formattedMessages = await loadInitialHistory()
      // Auto-scroll to bottom after loading history
      if (formattedMessages && formattedMessages.length > 0) {
        autoScrollToBottom()
      }
    }

    initializeHistory()
  }, [loadInitialHistory, autoScrollToBottom])

  // Handle infinite scroll
  const handleLoadMore = useCallback(() => {
    loadMoreMessages()
  }, [loadMoreMessages])

  useInfiniteScroll(
    messagesContainerRef,
    hasMoreHistory,
    isLoadingMore,
    handleLoadMore,
  )

  // Update scroll button visibility on scroll
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      updateScrollButton()
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [updateScrollButton])

  // Update scroll button when loading states change
  useEffect(() => {
    updateScrollButton()
  }, [isLoading, isLoadingHistory, isLoadingMore, updateScrollButton])

  const handleSendMessage = useCallback(
    async (reasoning?: { effort: 'low' | 'high' }) => {
      if (!input.trim() || isLoading) return

      if (tokens === 0) {
        router.push('/pricing')
        return
      }

      const userMessage = createMessage(CHAT_ROLES.USER, input.trim())

      // Add user message and auto-scroll
      addMessage(userMessage)
      setInput('')
      autoScrollToBottom()

      setIsLoading(true)

      try {
        // Preparing context for response
        const similarMessages =
          user && (await findSimilarMessages(userMessage.content, user.id, 5))

        const context =
          similarMessages && similarMessages.length > 0
            ? similarMessages
                .map((msg: Message) => `${msg.role}: ${msg.content}`)
                .join('\n')
            : undefined

        const response = await callOpenAi({
          messages: [...messages, userMessage],
          reasoning,
          context,
        })

        // Save messages to DB (fire and forget)
        saveMessageToDB(userMessage.content, CHAT_ROLES.USER)
        saveMessageToDB(
          response || CHAT_MESSAGES.ERROR_NO_RESPONSE,
          CHAT_ROLES.ASSISTANT,
        )

        await decrementTokens()

        const assistantMessage = createMessage(
          CHAT_ROLES.ASSISTANT,
          response || CHAT_MESSAGES.ERROR_NO_RESPONSE,
        )

        // Add assistant message and auto-scroll
        addMessage(assistantMessage)
        autoScrollToBottom()
      } catch (error) {
        console.error(error)
        const errorMessage = createMessage(
          CHAT_ROLES.ASSISTANT,
          CHAT_MESSAGES.ERROR_NO_RESPONSE,
        )

        // Add error message and auto-scroll
        addMessage(errorMessage)
        autoScrollToBottom()
      } finally {
        setIsLoading(false)
      }
    },
    [
      input,
      isLoading,
      tokens,
      router,
      user,
      messages,
      addMessage,
      autoScrollToBottom,
      decrementTokens,
    ],
  )

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom(messagesContainerRef)
  }, [])

  return (
    <div className={styles.chat}>
      <Header isVisible={messages.length === 0 && !isLoadingHistory} />
      <div className={styles.messages_container} ref={messagesContainerRef}>
        {isLoadingMore && (
          <div className={styles.loading_more}>Loading more messages...</div>
        )}
        {isLoadingHistory && (
          <div className={styles.loading_history}>
            Loading message history...
          </div>
        )}
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : undefined
          const showDateSeparator = shouldShowDateSeparator(
            message,
            previousMessage,
          )
          const messageDate = message.timestamp
            ? new Date(message.timestamp)
            : new Date()

          return (
            <div
              className={styles.message_content}
              key={message.id || `${index}-${message.role}`}>
              {showDateSeparator && (
                <div className={styles.date_separator}>
                  {formatDateLabel(messageDate)}
                </div>
              )}
              <div
                className={`${styles.message} ${
                  message.role === 'user' ? styles.user : styles.assistant
                }`}>
                {message.content}
              </div>
            </div>
          )
        })}
        {isLoading && (
          <div className={styles.typing}>{CHAT_MESSAGES.UI_TYPING}</div>
        )}
      </div>
      <div className={styles.input}>
        <textarea
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, handleSendMessage)}
          className={styles.textarea}
          placeholder={CHAT_MESSAGES.UI_PLACEHOLDER}
          value={input}
        />
        <div className={styles.actions}>
          <Button
            onClick={handleSendMessage}
            variant='round'
            disabled={isLoading}>
            <ArrowUpFromDot size={18} />
          </Button>
        </div>
        {showScrollButton && (
          <div className={styles.arrow_down} onClick={handleScrollToBottom}>
            <ArrowDown size={18} />
          </div>
        )}
      </div>
    </div>
  )
}
