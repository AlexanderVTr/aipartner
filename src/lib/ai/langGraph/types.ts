export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
}

export interface Options {
  messages: ChatMessage[]
  reasoning?: { effort: 'low' | 'high' } // For enhanced reasoning
}
