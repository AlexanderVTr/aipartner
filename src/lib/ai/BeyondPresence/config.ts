import { SYSTEM_PROMPT } from '@/lib/ai/prompt'

export interface BeyondPresenceConfig {
  agentId?: string
  avatarId?: string
  language?: string
  knowledgeBase?: string
}

/**
 * Beyond Presence configuration
 *
 * IMPORTANT: Beyond Presence API requires YOUR LiveKit server setup:
 * - You need your own LiveKit server (or LiveKit Cloud account)
 * - You need to generate LiveKit tokens for room access
 * - Beyond Presence does NOT provide LiveKit infrastructure
 *
 * To use this component:
 * 1. Set BEYOND_PRESENCE_API_KEY in your environment variables (server-side)
 * 2. Configure avatarId (required) - get from Beyond Presence dashboard
 * 3. Set up LiveKit server and configure LIVEKIT_URL and LIVEKIT_API_KEY env vars
 * 4. Generate LiveKit tokens for each session
 *
 * Note: Agent ID is NOT required for session creation - only avatarId is needed
 */
export const beyondPresenceConfig: BeyondPresenceConfig = {
  // Set your agent ID here - get from Beyond Presence dashboard
  agentId: undefined,
  // Set your avatar ID here - get from Beyond Presence dashboard (optional)
  avatarId: 'f30d7eef-6e71-433f-938d-cecdd8c0b653',
  // Agent ID is optional - not required for session creation
  language: 'en',
  knowledgeBase: SYSTEM_PROMPT,
}
