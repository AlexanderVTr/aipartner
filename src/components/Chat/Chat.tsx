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
} from '@/lib/History/History.service'
import { useUser } from '@clerk/nextjs'

export default function Chat() {
  const router = useRouter()
  const { tokens, decrementTokens } = useTokens()
  const { user } = useUser()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
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
              .map((msg: any) => `${msg.role}: ${msg.content}`)
              .join('\n')
          : undefined

      const response = await callOpenAi({
        messages: newMessages,
        reasoning,
        context,
      })

      await saveMessageToDB(userMessage.content, CHAT_ROLES.USER)
      await saveMessageToDB(
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

  return (
    <div className={styles.chat}>
      <Header isVisible={messages.length === 0} />
      <div className={styles.messages_container} ref={messagesContainerRef}>
        {messages &&
          messages.map((message, index) => (
            <div
              key={index}
              className={`${message.role === CHAT_ROLES.USER ? styles.user : ''}`}>
              {message.content}
            </div>
          ))}
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
