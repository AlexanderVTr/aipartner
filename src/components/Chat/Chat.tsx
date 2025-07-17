'use client'

import Header from '@/components/Header/Header'
import { Button } from '@/components/UI'
import callOpenAi from '@/lib/ai/callOpenAi'
import { useRef, useState, useEffect } from 'react'
import styles from './Chat.module.scss'
import { ArrowUpFromDot, ArrowDown, ArrowUp } from 'lucide-react'
import { ChatMessage } from '@/lib/ai/callOpenAi'
import {
  scrollToBottom,
  handleKeyDown,
  canScrollDown,
  shouldShowDateDivider,
} from './helpers'
import { CHAT_MESSAGES, CHAT_ROLES, PER_PAGE } from '@/constants/chat'
import { useRouter } from 'next/navigation'
import { useTokens } from '@/contexts/TokensContext'
import {
  findSimilarUserMessages,
  getMessages,
  saveMessageToDB,
} from '@/lib/History/History.service'
import { useUser } from '@clerk/nextjs'
import DateDivider from '@/components/UI/DateDivider/DateDivider'

export default function Chat() {
  const router = useRouter()
  const { tokens, decrementTokens } = useTokens()
  const { user } = useUser()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [oldMessageTimestamp, setOldMessageTimestamp] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Check scroll availability
  const checkScrollAvailability = () => {
    setShowScrollButton(canScrollDown(messagesContainerRef))
  }

  // Scroll to bottom when loading state changes
  useEffect(() => {
    scrollToBottom(messagesContainerRef)
  }, [isLoading])

  // Check scroll availability when messages change
  useEffect(() => {
    checkScrollAvailability()
  }, [messages, isLoading])

  // Add scroll event listener to track scroll position
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      checkScrollAvailability()
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Helper function to handle messages loading
  const handleMessagesLoaded = (
    newMessages: ChatMessage[],
    shouldPrepend = false,
  ) => {
    if (newMessages.length === 0) {
      setHasMoreMessages(false)
      return
    }

    if (shouldPrepend) {
      setMessages((prev) => [...newMessages, ...prev])
    } else {
      setMessages(newMessages)
    }

    setOldMessageTimestamp(newMessages[0].created_at || '')

    if (newMessages.length < PER_PAGE) {
      setHasMoreMessages(false)
    }
  }

  // SEND MESSAGE FUNCTION
  const handleSendMessage = async (reasoning?: { effort: 'low' | 'high' }) => {
    if (!input.trim() || isLoading) return

    if (tokens === 0) {
      router.push('/pricing')
      return
    }

    const userMessage = {
      role: CHAT_ROLES.USER,
      content: input.trim(),
      created_at: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage] as ChatMessage[]
    setMessages(newMessages)

    setInput('')
    setIsLoading(true)

    try {
      //Preparing context for response
      const similarUserMessages =
        user && (await findSimilarUserMessages(userMessage.content, user.id, 5))

      const userContext =
        similarUserMessages.length > 0
          ? similarUserMessages
              .map((msg: ChatMessage) => `${msg.content}`)
              .join('\n') //join the messages with a new line
          : undefined

      const response = await callOpenAi({
        messages: newMessages,
        reasoning,
        userContext,
      })

      // not awaiting for the response to save the user message
      // to avoid blocking the UI - FIRE AND FORGET
      saveMessageToDB(userMessage.content, CHAT_ROLES.USER)
      saveMessageToDB(
        response || CHAT_MESSAGES.ERROR_NO_RESPONSE,
        CHAT_ROLES.ASSISTANT,
      )

      await decrementTokens()

      setMessages((prev) => [
        ...prev,
        {
          role: CHAT_ROLES.ASSISTANT,
          content: response || CHAT_MESSAGES.ERROR_NO_RESPONSE,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          role: CHAT_ROLES.ASSISTANT,
          content: CHAT_MESSAGES.ERROR_NO_RESPONSE,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // INITIAL CHAT MESSAGES
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!user?.id) {
        //Clean chat on log out
        setMessages([])
        return
      }

      try {
        const recentMessages = await getMessages(PER_PAGE)
        handleMessagesLoaded(recentMessages)
      } catch (error) {
        console.error('Error loading initial messages', error)
        setHasMoreMessages(false)
      }
    }

    loadInitialMessages()
    setTimeout(() => {
      scrollToBottom(messagesContainerRef)
    }, 2000)
  }, [user])

  // LOAD MORE MESSAGES
  const handleLoadMore = async () => {
    try {
      const oldMessages = await getMessages(PER_PAGE, oldMessageTimestamp)
      handleMessagesLoaded(oldMessages, true)
    } catch (error) {
      console.error('Error fetching history', error)
      setHasMoreMessages(false)
    }
  }

  return (
    <div className={styles.chat}>
      <Header isVisible={messages.length === 0} />
      <div className={styles.messages_container} ref={messagesContainerRef}>
        {hasMoreMessages && user?.id && (
          <div className={styles.arrow_up} onClick={handleLoadMore}>
            Load history <ArrowUp size={18} />
          </div>
        )}
        {messages &&
          messages.map((message, index) => {
            const previousMessage = messages[index - 1]
            const showDateDivider = shouldShowDateDivider(
              message,
              previousMessage,
            )

            return (
              <div key={index} className={styles.messages_box}>
                {showDateDivider && (
                  <DateDivider>
                    {message.created_at || new Date().toISOString()}
                  </DateDivider>
                )}
                <div
                  className={`${message.role === CHAT_ROLES.USER ? styles.user : ''}`}>
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
          <div
            className={styles.arrow_down}
            onClick={() => scrollToBottom(messagesContainerRef)}>
            <ArrowDown size={18} />
          </div>
        )}
      </div>
    </div>
  )
}
