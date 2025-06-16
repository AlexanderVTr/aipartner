import { ThemeToggle } from '@/components/UI'
import Credits from '@/components/Credits/Credits'
import Email from '@/components/Email/Email'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { User } from 'lucide-react'
import styles from './Footer.module.scss'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Credits />
      <div className={styles.actions}>
        <Email />
        <ThemeToggle />
        <SignedOut>
          <SignInButton>
            <User size={18} />
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </footer>
  )
}
