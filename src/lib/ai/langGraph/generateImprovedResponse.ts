'use server'
import { AgentState } from './agentState'
import { ChatMessage } from './types'
import OpenAI from 'openai'
import { SYSTEM_PROMPT } from '../prompt'
import { openai } from '../client'

// This function is used to generate the first response for the agent
export async function generateImprovedResponse(state: typeof AgentState.State) {
  console.log('Agent: Generating improved response')

  const { assistantContext, firstResponse, messages, reasoning } = state

  if (!assistantContext) {
    return {
      finalResponse: firstResponse,
    }
  }

  const systemPrompt = assistantContext
    ? `${SYSTEM_PROMPT}

CONTEXT: Found similar responses in conversation history:
${assistantContext}

SELF-ANALYSIS TASK:
1. Compare your intended response with the historical responses above
2. Identify any repeated patterns: 
   - Opening phrases or exclamations
   - Ways of addressing the user
   - Question structures
   - Emotional expressions
   - Sentence patterns

3. If you find repetitions, rewrite your response to:
   - Express the same meaning differently
   - Use alternative emotional expressions
   - Vary your communication style
   - Keep your personality but with fresh language

4. Always maintain your playful, supportive nature - just express it uniquely each time.

GOAL: Same spirit, different words.`
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
  console.log('Completion improved response', response)
  return {
    finalResponse: response || firstResponse,
  }
}
