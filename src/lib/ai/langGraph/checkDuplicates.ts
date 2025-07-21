'use server'
import { AgentState } from './agentState'
import { currentUser } from '@clerk/nextjs/server'
import { findSimilarAssistantMessages } from '@/lib/History/History.service'
import { ChatMessage } from './types'

// This function is used to check for duplicates in the assistant messages
// It is used to find similar assistant messages and return them as a string
// This is used to help the agent understand the assistant's context and not repeat the same messages
export async function checkDuplicates(state: typeof AgentState.State) {
  console.log('Agent: Checking for duplicates')
  const { firstResponse } = state
  const user = await currentUser()

  if (!user || !firstResponse) {
    return { finalResponse: firstResponse }
  }

  const similarAssistantMessages = await findSimilarAssistantMessages(
    firstResponse,
    user.id,
    10,
  )

  const assistantContext =
    similarAssistantMessages.length > 0
      ? similarAssistantMessages
          .map((msg: ChatMessage) => `${msg.content}`)
          .join('\n')
      : undefined

  if (!assistantContext || assistantContext.length === 0) {
    console.log('Agent: No similar assistant messages found')
    return {
      finalResponse: firstResponse,
      assistantContext,
    }
  }

  console.log('Agent: Similar assistant messages found', assistantContext)
  return { assistantContext }
}
