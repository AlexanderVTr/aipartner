'use server'

import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './prompt'
import { openai } from './client'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Options {
  messages: ChatMessage[]
  reasoning?: { effort: 'low' | 'high' } // For enhanced reasoning
  context?: string
}

export default async function callOpenAi(options: Options) {
  const { messages, reasoning, context } = options

  const systemPrompt = context
    ? `${SYSTEM_PROMPT}\n\nThe following is the context of the conversation: ${context}`
    : SYSTEM_PROMPT

  const chatMessages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'assistant',
      content: "Hi, there! I'm Aisha, how are you today?",
    },
    ...messages,
  ]

  // Add new messages to the chat history
  chatMessages.push(...messages)

  // Prepare the request body
  const requestBody: OpenAI.Chat.ChatCompletionCreateParams & {
    reasoning?: { effort: 'low' | 'high' }
  } = {
    model: 'x-ai/grok-3-mini-beta',
    messages: chatMessages,
  }

  // Add reasoning parameter if specified
  if (reasoning) {
    requestBody.reasoning = reasoning
  }

  const completion = await openai.chat.completions.create(requestBody)

  return completion.choices[0].message.content
}
