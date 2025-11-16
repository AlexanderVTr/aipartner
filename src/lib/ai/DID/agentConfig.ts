export interface DIDAgentConfig {
  agentId: string
  compatibilityMode?: 'on' | 'off'
  fluent?: boolean
}

export const didAgentConfig: DIDAgentConfig = {
  agentId: process.env.NEXT_PUBLIC_DID_AGENT_ID || '',
  compatibilityMode: 'on',
  fluent: true,
}

