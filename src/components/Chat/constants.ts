// Chat configuration constants
export const CHAT_CONFIG = {
  MESSAGES_PER_PAGE: 20,
  INITIAL_HISTORY_LIMIT: 20,
  PAGINATION_LIMIT: 20,
  SCROLL_DELAY: 150,
} as const

export const LOADING_STATES = {
  LOADING_HISTORY: 'Loading message history...',
  LOADING_MORE: 'Loading more messages...',
} as const

export type LoadingState = (typeof LOADING_STATES)[keyof typeof LOADING_STATES]
