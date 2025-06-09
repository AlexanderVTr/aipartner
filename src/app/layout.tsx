import type { Metadata } from 'next'
import { Container } from '@/components/UI'
import { Fira_Sans, Roboto, Roboto_Flex } from 'next/font/google'
import './globals.scss'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
})

const robotoFlex = Roboto_Flex({
  variable: '--font-roboto-flex',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

const firaSans = Fira_Sans({
  variable: '--font-fira-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'AiGirls',
  description: 'AiGirls',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body
          className={`${roboto.variable} ${robotoFlex.variable} ${firaSans.variable}`}>
          <header>
            <Container>
              <h1>AiGirls</h1>
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </Container>
          </header>
          <main>{children}</main>
          <div className='shade'></div>
          <div className='shade2'></div>
        </body>
      </html>
    </ClerkProvider>
  )
}
