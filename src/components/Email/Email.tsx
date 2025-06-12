import styles from './Email.module.scss'
import { Mail } from 'lucide-react'

export default function Email() {
  return (
    <a href='mailto:info@aigirls.com' className={styles.email}>
      <Mail size={18} />
    </a>
  )
}
