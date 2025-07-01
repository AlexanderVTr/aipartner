import { ThemeToggle } from '@/components/UI'
import Credits from '@/components/Credits/Credits'
import Email from '@/components/Email/Email'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { User } from 'lucide-react'
import styles from './Footer.module.scss'
import { currentUser } from '@clerk/nextjs/server'

export default async function Footer() {
  const user = await currentUser()
  console.log('user', user)
  return (
    <footer className={styles.footer}>
      <Credits user={user} />
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
