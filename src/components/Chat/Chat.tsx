'use client'

import { Button } from '@/components/UI'
import callOpenAi from '@/lib/ai/callOpenAi'
import { useState } from 'react'
import styles from './Chat.module.scss'
import { ArrowUpFromDot } from 'lucide-react'
import { ChatMessage } from '@/lib/ai/callOpenAi'

export default function Chat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = async (reasoning?: { effort: 'low' | 'high' }) => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim() }

    const newMessages = [...messages, userMessage] as ChatMessage[]
    setMessages(newMessages)

    setInput('')
    setIsLoading(true)
    try {
      const _response = await callOpenAi({ messages: newMessages, reasoning })
      const assistantMessage = {
        role: 'assistant',
        content: _response || 'Sorry, I could not generate a response.',
      }

      setMessages((prev) => [...prev, assistantMessage] as ChatMessage[])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not generate a response.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.chat}>
      <h1>AiGirls</h1>
      <div className={styles.messages_container}>
        {messages &&
          messages.map((message, index) => (
            <div
              key={index}
              className={`${message.role === 'user' ? styles.user : ''}`}>
              {message.content}
            </div>
          ))}
        {isLoading && <div className={styles.typing}>Aisha is typing...</div>}
      </div>
      <div className={styles.input}>
        <textarea
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.textarea}
          placeholder="I am Aisha, let's chat!"
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
      </div>
    </div>
  )
}
