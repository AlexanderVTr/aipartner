import styles from './page.module.css'
import { Button } from '@/components/UI'

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div>
          <Button
            variant='primary'
            href='https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
            target='_blank'
            rel='noopener noreferrer'>
            Deploy now
          </Button>
          <Button
            variant='secondary'
            href='https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
            target='_blank'
            rel='noopener noreferrer'>
            Read our docs
          </Button>
        </div>
      </main>
    </div>
  )
}
