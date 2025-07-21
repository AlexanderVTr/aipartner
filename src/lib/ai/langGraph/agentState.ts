import { Annotation } from '@langchain/langgraph'
import { ChatMessage } from './types'

export const AgentState = Annotation.Root({
  messages: Annotation<ChatMessage[]>({
    reducer: (existing, update) => existing.concat(update),
    default: () => [],
  }),
  reasoning: Annotation<{ effort: 'low' | 'high' } | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  userContext: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  firstResponse: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  assistantContext: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  finalResponse: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
})
