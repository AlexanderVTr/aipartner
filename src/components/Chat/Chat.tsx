'use client'

import { Button } from '@/components/UI'
import callOpenAi from '@/lib/callOpenAi'
import { useState } from 'react'
import styles from './Chat.module.scss'
import { ArrowUpFromDot } from 'lucide-react'

export default function Chat() {
  const [response, setResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAiCall = async (
    message: string,
    reasoning?: { effort: 'low' | 'high' },
  ) => {
    setIsLoading(true)
    try {
      const _response = await callOpenAi({ message, reasoning })
      setResponse(_response)
    } catch (error) {
      console.error(error)
      setResponse('Error occurred while calling AI')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.chat}>
      <h1>AiGirls</h1>
      <div className={styles.chat__messages}>
        {isLoading && <div>Loading...</div>}
        {response && <div>{response}</div>}
      </div>
      <div className={styles.chat__input}>
        <textarea className={styles.chat__textarea} placeholder='Hi, there!' />
        <div className={styles.chat__actions}>
          <Button
            onClick={() =>
              handleAiCall(
                'Analyze the pros and cons of using TypeScript in modern web development',
              )
            }
            variant='round'
            disabled={isLoading}>
            <ArrowUpFromDot size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
