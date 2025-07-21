'use server'

import { StateGraph, START, END } from '@langchain/langgraph/'
import { AgentState } from './agentState'
import { Options } from './types'
import { prepareUserContext } from './prepareUserContext'
import { generateFirstResponse } from './generateFirstResponse'
import { checkDuplicates } from './checkDuplicates'
import { generateImprovedResponse } from './generateImprovedResponse'

function createAgent() {
  const workflow = new StateGraph(AgentState)
    .addNode('prepareUserContext', prepareUserContext)
    .addNode('generateFirstResponse', generateFirstResponse)
    .addNode('checkDuplicates', checkDuplicates)
    .addNode('generateImprovedResponse', generateImprovedResponse)
    .addEdge(START, 'prepareUserContext')
    .addEdge('prepareUserContext', 'generateFirstResponse')
    .addEdge('generateFirstResponse', 'checkDuplicates')
    .addConditionalEdges('checkDuplicates', routeNextStep, {
      'generateImprovedResponse': 'generateImprovedResponse',
      [END]: END,
    })
    .addEdge('generateImprovedResponse', END)

  return workflow.compile()
}

export async function runAgent(options: Options) {
  const { messages, reasoning } = options

  const agent = createAgent()

  try {
    const result = await agent.invoke({
      messages,
      reasoning,
    })

    return result.finalResponse
  } catch (error) {
    console.error('Error running agent', error)
    throw error
  }
}

function routeNextStep(state: typeof AgentState.State) {
  const { assistantContext } = state

  if (assistantContext && assistantContext.length > 0) {
    return 'generateImprovedResponse'
  }

  return END
}
