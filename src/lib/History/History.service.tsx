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

// Find similar user messages only using dedicated DB function
export async function findSimilarUserMessages(
  query: string,
  userId: string,
  limit: number = 10,
) {
  try {
    const embedding = await openaiEmbedding.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    const { data, error } = await supabaseAdmin.rpc(
      'find_similar_user_messages',
      {
        query_embedding: embedding.data[0].embedding,
        clerk_user_id: userId,
        similarity_threshold: 0.3, // 0-1 how similar the messages need to be
        match_count: limit, // how many messages will be checked
      },
    )

    if (error) {
      console.error('Error finding similar user messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in findSimilarUserMessages:', error)
    return []
  }
}

// Find similar assistant messages only using dedicated DB function
export async function findSimilarAssistantMessages(
  query: string,
  userId: string,
  limit: number = 10,
) {
  try {
    const embedding = await openaiEmbedding.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })

    const { data, error } = await supabaseAdmin.rpc(
      'find_similar_assistant_messages',
      {
        query_embedding: embedding.data[0].embedding,
        clerk_user_id: userId,
        similarity_threshold: 0.7, // 0-1 how similar the messages need to be
        match_count: limit, // how many messages will be checked
      },
    )

    if (error) {
      console.error('Error finding similar assistant messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in findSimilarAssistantMessages:', error)
    return []
  }
}

export async function getMessages(limit: number, beforeTimestamp?: string) {
  const user = await currentUser()

  if (!user) return []

  let query = supabaseAdmin
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (beforeTimestamp) {
    query = query.lt('created_at', beforeTimestamp)
  }

  const { data, error } = await query
  if (error) {
    console.log('Error fetching messages', error)
    return []
  }

  return data.reverse() || []
}
