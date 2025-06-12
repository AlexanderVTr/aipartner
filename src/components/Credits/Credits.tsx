import styles from './Credits.module.scss'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Credits() {
  return (
    <Link href='/pricing' className={styles.credits}>
      <Sparkles className={styles.sparklesIcon} size={18} />
      10
    </Link>
  )
}
