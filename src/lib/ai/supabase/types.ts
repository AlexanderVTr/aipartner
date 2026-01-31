export interface User {
  id: string
  clerk_user_id: string
  email: string
  tokens_balance: number
  plan: 'free' | 'pro' | 'premium' | 'demo'
  created_at: string
  updated_at?: string
}

export interface Message {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface MessageEmbedding {
  message_id: string
  embedding: number[] // pgvector is an array of numbers
  created_at: string
}

export interface SimilarMessage {
  message_id: string
  content: string
  similarity: number
}

// Database functions return types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at'>
        Update: Partial<Omit<User, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id'>>
      }
      message_embeddings: {
        Row: MessageEmbedding
        Insert: Omit<MessageEmbedding, 'created_at'>
        Update: Partial<MessageEmbedding>
      }
    }
    Functions: {
      find_similar_messages: {
        Args: {
          query_embedding: number[]
          user_uuid: string
          similarity_threshold?: number
          match_count?: number
        }
        Returns: SimilarMessage[]
      }
    }
  }
}
