'use client'
import styles from './Tokens.module.scss'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getTokensFromDB } from '@/lib/User/User.service'
import { useState, useEffect } from 'react'

export default function Tokens() {
  const [tokens, setTokens] = useState(0)
  //TODOUse context to get tokens
  useEffect(() => {
    const fetchTokens = async () => {
      const tokens = await getTokensFromDB()
      setTokens(tokens)
    }
    fetchTokens()
  }, [])

  return (
    <Link href='/pricing' className={styles.tokens}>
      <Sparkles className={styles.sparklesIcon} size={18} />
      {tokens}
    </Link>
  )
}
