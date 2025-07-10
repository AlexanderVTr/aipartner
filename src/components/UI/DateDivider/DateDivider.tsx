import styles from './DateDivider.module.scss'
import { formatMessageDate } from '@/helpers/helpers'

export default function DateDivider({ children }: { children: string }) {
  return (
    <div className={styles.date_divider}>{formatMessageDate(children)}</div>
  )
}
