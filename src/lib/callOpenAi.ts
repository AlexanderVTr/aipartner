'use server'

import OpenAI from 'openai'

interface CallAiOptions {
  message?: string
  reasoning?: { effort: 'low' | 'high' } // For enhanced reasoning
}

export default async function callOpenAi(options: CallAiOptions = {}) {
  const { message = 'Hello, how are you?', reasoning } = options

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://aigirls.ai',
      'X-Title': 'AIGirls',
    },
  })

  // Prepare the request body
  const requestBody: OpenAI.Chat.ChatCompletionCreateParams & {
    reasoning?: { effort: 'low' | 'high' }
  } = {
    model: 'x-ai/grok-3-mini-beta',
    messages: [{ role: 'user', content: message }],
  }

  // Add reasoning parameter if specified
  if (reasoning) {
    requestBody.reasoning = reasoning
  }

  const completion = await openai.chat.completions.create(requestBody)

  return completion.choices[0].message.content
}
