'use server'
import { supabaseAdmin } from '../ai/supabase/client'
import { currentUser } from '@clerk/nextjs/server'
import { openaiEmbedding } from '../ai/client'

export async function saveMessageToDB(message: string, role: string) {
  const user = await currentUser()

  if (!user) return

  const { data: savedMessage, error: messageError } = await supabaseAdmin
    .from('messages')
    .insert({
      user_id: user.id,
      role: role,
      content: message,
    })
    .select()
    .single()

  if (messageError) console.error('messageError', messageError)

  // EMBEDDING VECTOR DB
  // Create embeddings
  const embedding = await openaiEmbedding.embeddings.create({
    model: 'text-embedding-3-small',
    input: message,
  })

  // Save embeddings
  const { error: embeddedError } = await supabaseAdmin
    .from('message_embeddings')
    .insert({
      message_id: savedMessage.id,
      embedding: embedding.data[0].embedding,
      user_id: user.id,
      role: role,
    })
    .select()
    .single()

  if (messageError) console.error('embeddedError', embeddedError)
}

// function found similar sentences in the vector DB
export async function findSimilarMessages(
  query: string,
  userId: string,
  limit: number = 10,
) {
  try {
    const embedding = await openaiEmbedding.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    const { data, error } = await supabaseAdmin.rpc('find_similar_messages', {
      query_embedding: embedding.data[0].embedding,
      clerk_user_id: userId,
      include_assistant: true,
      similarity_threshold: 0.3,
      match_count: limit,
    })

    if (error) {
      console.error('Error finding similar messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in findSimilarMessages:', error)
    return []
  }
}

export async function getMessages() {
  const user = await currentUser()

  if (!user) return []

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.log('Error fetching messages', error)
    return []
  }

  return data || []
}

// New function for paginated messages (for infinite scroll)
export async function getMessagesPaginated(
  limit: number = 20,
  offset: number = 0,
) {
  const user = await currentUser()

  if (!user) return { messages: [], hasMore: false }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) // Most recent first for pagination
    .range(offset, offset + limit - 1)

  if (error) {
    console.log('Error fetching paginated messages', error)
    return { messages: [], hasMore: false }
  }

  // Check if there are more messages
  const { count } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const hasMore = count ? offset + limit < count : false

  return {
    messages: data ? data.reverse() : [], // Reverse to show oldest first in UI
    hasMore,
  }
}

// Function to get the total count of messages for a user
export async function getMessagesCount() {
  const user = await currentUser()

  if (!user) return 0

  const { count, error } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.log('Error fetching messages count', error)
    return 0
  }

  return count || 0
}
