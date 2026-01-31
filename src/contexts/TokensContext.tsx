'use client'

import {
  useEffect,
  createContext,
  ReactNode,
  useState,
  useContext,
} from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  decrementTokensDB,
  deductVideoCallTokens as deductVideoCallTokensDB,
  getTokensFromDB,
} from '@/lib/Tokens/Tokens.service'
import {
  GUEST_TOKENS_STORAGE_KEY,
  TOKENS_PER_PLAN,
  VIDEO_CALL_TOKENS_PER_MINUTE,
} from '@/constants/chat'

interface TokensContextType {
  tokens: number
  decrementTokens: () => Promise<void>
  deductVideoCallTokens: (callDurationMinutes: number) => Promise<number>
}

const TokensContext = createContext<TokensContextType | undefined>(undefined)

function getGuestTokensFromStorage(): number | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(GUEST_TOKENS_STORAGE_KEY)
  if (stored === null) return null
  const parsed = parseInt(stored, 10)
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed
}

function setGuestTokensToStorage(value: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_TOKENS_STORAGE_KEY, String(value))
}

export function TokensProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState(0)
  const { isSignedIn } = useAuth()

  const refetchTokens = async () => {
    try {
      const serverTokens = await getTokensFromDB()
      if (!isSignedIn) {
        const stored = getGuestTokensFromStorage()
        if (stored !== null) {
          setTokens(stored)
        } else {
          const initial = serverTokens ?? TOKENS_PER_PLAN.free
          setTokens(initial)
          setGuestTokensToStorage(initial)
        }
      } else {
        setTokens(serverTokens)
      }
    } catch (error) {
      console.error('Error fetching tokens', error)
    }
  }

  const handleDecrementTokens = async () => {
    try {
      if (isSignedIn) {
        await decrementTokensDB()
        setTokens((prev) => prev - 1)
      } else {
        setTokens((prev) => {
          const next = Math.max(0, prev - 1)
          setGuestTokensToStorage(next)
          return next
        })
      }
    } catch (error) {
      console.error('Error decrementing tokens', error)
      await refetchTokens()
    }
  }

  const handleDeductVideoCallTokens = async (
    callDurationMinutes: number,
  ): Promise<number> => {
    try {
      if (isSignedIn) {
        const newBalance = await deductVideoCallTokensDB(callDurationMinutes)
        setTokens(newBalance)
        return newBalance
      }
      const tokensToDeduct =
        Math.ceil(callDurationMinutes) * VIDEO_CALL_TOKENS_PER_MINUTE
      const newBalance = Math.max(0, tokens - tokensToDeduct)
      setTokens(newBalance)
      setGuestTokensToStorage(newBalance)
      return newBalance
    } catch (error) {
      console.error('Error deducting video call tokens', error)
      await refetchTokens()
      return 0
    }
  }

  useEffect(() => {
    refetchTokens()
  }, [isSignedIn])

  return (
    <TokensContext.Provider
      value={{
        tokens,
        decrementTokens: handleDecrementTokens,
        deductVideoCallTokens: handleDeductVideoCallTokens,
      }}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokens() {
  const context = useContext(TokensContext)

  if (!context) {
    throw new Error('useTokens have to be called inside TokensProvider only')
  }
  return context
}
