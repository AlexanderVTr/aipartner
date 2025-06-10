import styles from './ThemeToggle.module.scss'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <div className={`${styles.themeToggle} ${className || ''}`}>
      <input
        type='checkbox'
        id='theme-toggle'
        className={styles.checkbox}
        aria-label='Toggle theme'
      />
      <label htmlFor='theme-toggle' className={styles.label}>
        <Sun className={styles.sunIcon} size={18} />
        <Moon className={styles.moonIcon} size={18} />
      </label>
    </div>
  )
}
