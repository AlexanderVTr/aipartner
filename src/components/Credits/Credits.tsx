import styles from './Credits.module.scss'
import { Sparkles } from 'lucide-react'

export default function Credits() {
  return (
    <div className={styles.credits}>
      <Sparkles className={styles.sparklesIcon} size={18} />
      10
    </div>
  )
}
