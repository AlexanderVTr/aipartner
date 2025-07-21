'use server'
import { AgentState } from './agentState'
import { currentUser } from '@clerk/nextjs/server'
import { findSimilarUserMessages } from '@/lib/History/History.service'
import { ChatMessage } from './types'

// This function is used to prepare the user context for the agent
// It is used to find similar user messages and return them as a string
// This is used to help the agent understand the user's context and not repeat the same messages
export async function prepareUserContext(state: typeof AgentState.State) {
  console.log('Agent: Preparing user context')
  const { messages } = state
  const user = await currentUser()

  if (!user || !messages[0]) {
    return { userContext: undefined }
  }

  const lastMessage = messages[messages.length - 1]

  if (lastMessage.role === 'assistant') {
    return { userContext: undefined }
  }

  const similarUserMessages = await findSimilarUserMessages(
    lastMessage.content,
    user.id,
    5,
  )

  // Join the similar user messages with a new line to context
  const userContext =
    similarUserMessages.length > 0
      ? similarUserMessages
          .map((msg: ChatMessage) => `${msg.content}`)
          .join('\n')
      : undefined

  return { userContext }
}
