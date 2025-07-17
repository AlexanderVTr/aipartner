'use server'

import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './prompt'
import { openai } from './client'
import { findSimilarAssistantMessages } from '../History/History.service'
import { currentUser } from '@clerk/nextjs/server'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
}

export interface Options {
  messages: ChatMessage[]
  reasoning?: { effort: 'low' | 'high' } // For enhanced reasoning
  userContext?: string
  assistantContext?: string
}

export default async function callOpenAi(options: Options) {
  const { messages, reasoning, userContext } = options
  const user = await currentUser()

  const systemPrompt = userContext
    ? `${SYSTEM_PROMPT}\n\nThe following is the context of the conversation and the user's messages only: ${userContext}`
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

  console.log('completion', completion.choices[0].message.content)
  //TODO: add the assistant messages to the context
  const similarAssistantMessages =
    completion.choices[0].message.content &&
    user &&
    (await findSimilarAssistantMessages(
      completion.choices[0].message.content,
      user.id,
      10,
    ))

  const assistantContext =
    similarAssistantMessages.length > 0
      ? similarAssistantMessages
          .map((msg: ChatMessage) => `${msg.content}`)
          .join('\n') //join the messages with a new line
      : undefined

  // And request again if answer is to similar to the assistant messages in the chat
  if (assistantContext.length > 0) {
    const systemPrompt = assistantContext
      ? `${SYSTEM_PROMPT}\n\nThe following is the context of the conversation 
      and the assistant's messages only. Don't repeat yourself to often,
      and don't repeat the same answer to often,
      and don't repeat the same question to often,
      and don't repeat exclamation to often like "wow", "Ой" and other exclamations,
      and be more original with calling the user in the chat and sometimes not use it at all for more natural chat: ${assistantContext}`
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

    // Prepare the request body
    const requestBody_additional: OpenAI.Chat.ChatCompletionCreateParams & {
      reasoning?: { effort: 'low' | 'high' }
    } = {
      model: 'x-ai/grok-3-mini-beta',
      messages: chatMessages,
    }

    // Add reasoning parameter if specified
    if (reasoning) {
      requestBody.reasoning = reasoning
    }

    const completion_additional = await openai.chat.completions.create(
      requestBody_additional,
    )
    // Add new messages to the chat history
    chatMessages.push(...messages)
    console.log(
      'completion_additional',
      completion_additional.choices[0].message.content,
    )
    return completion_additional.choices[0].message.content
  }

  // Add new messages to the chat history
  chatMessages.push(...messages)
  return completion.choices[0].message.content
}
