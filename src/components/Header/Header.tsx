import styles from './Header.module.scss'
import { CHAT_MESSAGES } from '@/constants/chat'

export default function Header({ isVisible }: { isVisible: boolean }) {
  return (
    <header className={`${styles.header} ${isVisible ? styles.visible : ''}`}>
      <h1 className={styles.title}>
        <span>Hi, I'm </span>
        <strong>{CHAT_MESSAGES.UI_TITLE}</strong>
      </h1>
      <div className={styles.content}>
        <p>{CHAT_MESSAGES.UI_DESCRIPTION}</p>
      </div>
    </header>
  )
}
