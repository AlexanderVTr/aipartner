import OpenAI from 'openai'

// OpenAI client with OpenRouter
export const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://aigirls.ai',
    'X-Title': 'AIGirls',
  },
})

// OpenAI client with Embedding models
export const openaiEmbedding = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://aigirls.ai',
    'X-Title': 'AIGirls-Embedding',
  },
})
