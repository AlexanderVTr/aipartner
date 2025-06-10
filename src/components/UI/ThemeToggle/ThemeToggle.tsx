import styles from './ThemeToggle.module.scss'

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
        <span className={styles.sunIcon}>☀️</span>
        <span className={styles.moonIcon}>🌙</span>
        <span className={styles.slider}></span>
      </label>
    </div>
  )
}
