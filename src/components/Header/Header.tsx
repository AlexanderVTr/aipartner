import Link from 'next/link'
import styles from './Header.module.scss'
import { CHAT_MESSAGES } from '@/constants/chat'

export default function Header({ isVisible = false }: { isVisible?: boolean }) {
  return (
    <header
      className={`${styles.header} ${isVisible ? styles.visible : styles.alignCenter}`}>
      <h1 className={styles.title}>
        <Link href='/'>
          <span>Hi, I&apos;m </span>
          <strong>{CHAT_MESSAGES.UI_TITLE}</strong>
        </Link>
      </h1>
      <div className={styles.content}>
        <p>{CHAT_MESSAGES.UI_DESCRIPTION}</p>
      </div>
    </header>
  )
}
