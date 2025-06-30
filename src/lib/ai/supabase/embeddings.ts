import { supabase } from './client'
import { openai } from '@/lib/ai/client'

export class EmbeddingService {
  // Create an embedding for text
  static async createEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // or text-embedding-3-large
      input: text,
    })

    return response.data[0].embedding
  }

  // Save a message with an embedding
  static async saveMessageWithEmbedding(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<string> {
    // Save message to messages table
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        role,
        content,
      })
      .select('id')
      .single()

    if (messageError) throw messageError

    // Create embedding for the message content
    const embedding = await this.createEmbedding(content)

    // Save embedding to separate message_embeddings table
    const { error: embeddingError } = await supabase
      .from('message_embeddings')
      .insert({
        message_id: message.id,
        embedding,
      })

    if (embeddingError) throw embeddingError

    return message.id
  }

  // Find similar messages
  static async findSimilarMessages(
    query: string,
    userId: string,
    threshold: number = 0.8,
    limit: number = 5,
  ) {
    const queryEmbedding = await this.createEmbedding(query)

    const { data, error } = await supabase.rpc('find_similar_messages', {
      query_embedding: queryEmbedding,
      user_uuid: userId,
      similarity_threshold: threshold,
      match_count: limit,
    })

    if (error) throw error
    return data
  }

  // Get user's message history
  static async getUserMessages(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}
