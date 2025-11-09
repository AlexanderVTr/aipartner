import type { Metadata } from 'next'
import { Fira_Sans, Roboto_Flex } from 'next/font/google'
import './globals.scss'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'

const robotoFlex = Roboto_Flex({
  variable: '--font-roboto-flex',
  subsets: ['latin'],
  weight: ['400', '500'], // Только используемые weights
})

const firaSans = Fira_Sans({
  variable: '--font-fira-sans',
  subsets: ['latin'],
  weight: ['600', '700'], // Только используемые weights
})

export const metadata: Metadata = {
  title: 'AiSha - Your AI Companion for Meaningful Conversations',
  description:
    'Meet AiSha, an emotionally intelligent AI companion who understands your mood, remembers your conversations, and creates deep, meaningful connections. Experience personalized dialogue with an AI that truly listens and responds with empathy.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body className={`${robotoFlex.variable} ${firaSans.variable}`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
