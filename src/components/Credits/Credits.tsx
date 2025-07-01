import styles from './Credits.module.scss'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { User } from '@clerk/nextjs/server'
import { getCreditsFromDB } from '@/lib/User/User.service'

export default async function Credits({ user }: { user: User }) {
  console.log('user', user)
  let credits = 0
  if (user) {
    credits = await getCreditsFromDB(
      user.id,
      user.emailAddresses[0].emailAddress,
    )
    console.log('credits', credits)
  }
  return (
    <Link href='/pricing' className={styles.credits}>
      <Sparkles className={styles.sparklesIcon} size={18} />
      {credits}
    </Link>
  )
}
