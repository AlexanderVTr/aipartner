'use server'

import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './prompt'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Options {
  messages: ChatMessage[]
  reasoning?: { effort: 'low' | 'high' } // For enhanced reasoning
}

const chatMessages: ChatMessage[] = [
  {
    role: 'system',
    content: SYSTEM_PROMPT,
  },
  {
    role: 'assistant',
    content: "Hi, there! I'm Aisha, how are you today?",
  },
]

// OpenAI client with OpenRouter
export const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://aigirls.ai',
    'X-Title': 'AIGirls',
  },
})

export default async function callOpenAi(options: Options) {
  const { messages, reasoning } = options

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
