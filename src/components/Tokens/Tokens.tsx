'use client'
import styles from './Tokens.module.scss'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useTokens } from '@/contexts/TokensContext'

export default function Tokens() {
  const { tokens } = useTokens()

  return (
    <Link href='/pricing' className={styles.tokens}>
      <Sparkles className={styles.sparklesIcon} size={18} />
      {tokens}
    </Link>
  )
}
