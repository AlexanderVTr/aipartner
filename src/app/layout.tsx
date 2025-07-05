import type { Metadata } from 'next'
import { Fira_Sans, Roboto_Flex } from 'next/font/google'
import './globals.scss'
import { ClerkProvider } from '@clerk/nextjs'

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
        <body className={`${robotoFlex.variable} ${firaSans.variable}`}>
          {children}
          <div className='shade'></div>
          <div className='shade2'></div>
        </body>
      </html>
    </ClerkProvider>
  )
}
