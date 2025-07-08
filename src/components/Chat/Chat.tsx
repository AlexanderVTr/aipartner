'use client'

import Header from '@/components/Header/Header'
import { Button } from '@/components/UI'
import callOpenAi from '@/lib/ai/callOpenAi'
import { useRef, useState, useEffect } from 'react'
import styles from './Chat.module.scss'
import { ArrowUpFromDot, ArrowDown } from 'lucide-react'
import { ChatMessage } from '@/lib/ai/callOpenAi'
import { scrollToBottom, handleKeyDown, canScrollDown } from './helpers'
import { CHAT_MESSAGES, CHAT_ROLES } from '@/constants/chat'
import { useRouter } from 'next/navigation'
import { useTokens } from '@/contexts/TokensContext'
import {
  findSimilarMessages,
  saveMessageToDB,
  getMessages,
} from '@/lib/History/History.service'
import { useUser } from '@clerk/nextjs'
import InfiniteScroll from 'react-infinite-scroll-component'

interface Message {
  role: string
  content: string
}

export default function Chat() {
  const router = useRouter()
  const { tokens, decrementTokens } = useTokens()
  const { user } = useUser()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  // Load initial chat history
  useEffect(() => {
    const fetchInitialHistory = async () => {
      if (!user) return
      try {
        const history = await getMessages(1, PAGE_SIZE)
        if (history && Array.isArray(history)) {
          setMessages(history)
          setHasMore(history.length === PAGE_SIZE)
        } else {
          setHasMore(false)
        }
      } catch (e) {
        setHasMore(false)
        console.error('Failed to load chat history', e)
      }
    }
    fetchInitialHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Load more history for infinite scroll
  const loadMoreMessages = async () => {
    if (!user) return
    const nextPage = page + 1
    try {
      const history = await getMessages(nextPage, PAGE_SIZE)
      if (history && Array.isArray(history)) {
        setMessages((prev) => [...history, ...prev]) // prepend older messages for chat
        setPage(nextPage)
        setHasMore(history.length === PAGE_SIZE)
      } else {
        setHasMore(false)
      }
    } catch (e) {
      setHasMore(false)
      console.error('Failed to load more chat history', e)
    }
  }
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Check scroll availability
  const checkScrollAvailability = () => {
    setShowScrollButton(canScrollDown(messagesContainerRef))
  }

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    scrollToBottom(messagesContainerRef)
  }, [messages, isLoading])

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

  const handleSendMessage = async (reasoning?: { effort: 'low' | 'high' }) => {
    if (!input.trim() || isLoading) return

    if (tokens === 0) {
      router.push('/pricing')
      return
    }

    const userMessage = {
      role: CHAT_ROLES.USER,
      content: input.trim(),
    }

    const newMessages = [...messages, userMessage] as ChatMessage[]
    setMessages(newMessages)

    setInput('')
    setIsLoading(true)

    try {
      //Preparing context for response
      const similarMessages =
        user && (await findSimilarMessages(userMessage.content, user.id, 5))

      const context =
        similarMessages && similarMessages.length > 0
          ? similarMessages
              .map((msg: Message) => `${msg.role}: ${msg.content}`)
              .join('\n')
          : undefined

      const response = await callOpenAi({
        messages: newMessages,
        reasoning,
        context,
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
        },
      ])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          role: CHAT_ROLES.ASSISTANT,
          content: CHAT_MESSAGES.ERROR_NO_RESPONSE,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('Loaded messages:', messages)
  }, [messages])

  return (
    <div className={styles.chat}>
      <Header isVisible={messages.length === 0} />
      <InfiniteScroll
        dataLength={messages.length}
        next={loadMoreMessages}
        hasMore={hasMore}
        inverse={true}
        loader={<div className={styles.typing}>{CHAT_MESSAGES.UI_TYPING}</div>}
        scrollableTarget="messagesContainer"
        style={{ overflow: 'unset', display: 'block' }}
      >
        <div
          id="messagesContainer"
          className={styles.messages_container}
          ref={messagesContainerRef}
          style={{ height: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} // Remove column-reverse for normal scroll
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${message.role === CHAT_ROLES.USER ? styles.user : ''}`}>
              {message.content}
            </div>
          ))}
        </div>
      </InfiniteScroll>
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
