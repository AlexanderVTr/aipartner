import { Container, ThemeToggle } from '@/components/UI'
import Chat from '@/components/Chat/Chat'
import Credits from '@/components/Credits/Credits'
import Email from '@/components/Email/Email'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs'

export default function Home() {
  return (
    <Container>
      <Chat />
      <footer className='footer'>
        <Credits />
        <div>
          <Email />
          <ThemeToggle />
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </footer>
    </Container>
  )
}
