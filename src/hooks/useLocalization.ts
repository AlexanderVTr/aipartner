import { CHAT_MESSAGES_EN } from '@/constants/locales/en'
import { CHAT_MESSAGES_RU } from '@/constants/locales/ru'

type Language = 'en' | 'ru'

const LOCALES = {
  en: CHAT_MESSAGES_EN,
  ru: CHAT_MESSAGES_RU,
} as const

// Simple hook for localization
export const useLocalization = (language: Language = 'en') => {
  const messages = LOCALES[language]

  return {
    messages,
    t: (key: keyof typeof CHAT_MESSAGES_EN) => messages[key],
  }
}

// Export current locale (can be replaced with context/state management)
export const getCurrentLocale = (): Language => {
  // This can be replaced with:
  // - localStorage.getItem('language')
  // - user preferences from API
  // - browser language detection
  return 'en'
}
