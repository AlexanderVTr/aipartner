// Localization keys - can be easily replaced with translations
export const CHAT_MESSAGES = {
  // Error messages
  ERROR_NO_RESPONSE: 'Sorry, I could not generate a response.',
  ERROR_GENERAL:
    'Sorry, there was an error processing your request. Please try again.',

  // UI messages
  UI_TYPING: 'Aisha is typing',
  UI_PLACEHOLDER: "Let's chat!",
  UI_TITLE: 'AiSha',

  // Actions
  ACTION_SEND: 'Send',
  ACTION_CLEAR: 'Clear Chat',
  ACTION_EXAMPLE: 'Example',
  UI_DESCRIPTION:
    'Meet your AI girlfriend — a smart, friendly virtual companion here to chat, have fun, and keep you company anytime. Whether you’re looking for light conversation, a bit of laughter, or just someone to talk to, she’s always ready to brighten your day with a personal touch.',
} as const

// System constants (don't need localization)
export const CHAT_ROLES = {
  USER: 'user' as const,
  ASSISTANT: 'assistant' as const,
  SYSTEM: 'system' as const,
} as const

export const REASONING_MODES = {
  LOW: { effort: 'low' as const },
  HIGH: { effort: 'high' as const },
} as const

export const TOKENS_PER_PLAN = {
  pro: 2999,
  premium: 9990,
  free: 100,
} as const

export const PER_PAGE = 20
