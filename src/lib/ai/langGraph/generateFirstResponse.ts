'use server'
import { AgentState } from './agentState'
import { ChatMessage } from './types'
import OpenAI from 'openai'
import { SYSTEM_PROMPT } from '../prompt'
import { openai } from '../client'

// This function is used to generate the first response for the agent
export async function generateFirstResponse(state: typeof AgentState.State) {
  console.log('Agent: Generating first response')

  const { userContext, messages, reasoning } = state
  const systemPrompt = userContext
    ? `${SYSTEM_PROMPT}

IMPORTANT: Always respond directly to the user's CURRENT message first.

Previous conversation context (for reference only):
${userContext}

Current user message: "${messages[messages.length - 1]?.content}"

PRIORITY: Answer the current question directly and accurately. Use context only if relevant to the current question.`
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
  const response = completion.choices[0].message.content
  console.log('completion', response)

  return {
    firstResponse: response || undefined,
  }
}
