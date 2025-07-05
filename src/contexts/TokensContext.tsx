'use client'

import {
  useEffect,
  createContext,
  ReactNode,
  useState,
  useContext,
} from 'react'
import { decrementTokens, getTokensFromDB } from '@/lib/User/User.service'

interface TokensContextType {
  tokens: number
  decrementTokens: () => Promise<void>
}

const TokensContext = createContext<TokensContextType | undefined>(undefined)

export function TokensProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState(0)

  const refetchTokens = async () => {
    try {
      const newTokens = await getTokensFromDB()
      setTokens(newTokens)
    } catch (error) {
      console.error('Error fetching tokens', error)
    }
  }

  const handleDecrementTokens = async () => {
    try {
      await decrementTokens()
      //Optimistic update
      setTokens((prev) => prev - 1)
    } catch (error) {
      console.error('Error decrementing tokens', error)
      await refetchTokens()
    }
  }

  useEffect(() => {
    refetchTokens()
  }, [])

  return (
    <TokensContext.Provider
      value={{
        tokens,
        decrementTokens: handleDecrementTokens,
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
