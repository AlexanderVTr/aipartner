import { Container } from '@/components/UI'
import { PricingTable, SignUpButton } from '@clerk/nextjs'
import Header from '@/components/Header/Header'
import { currentUser } from '@clerk/nextjs/server'
import styles from './Pricing.module.scss'

export default async function Home() {
  const user = await currentUser()
  return (
    <>
      <Header />
      {user ? (
        <PricingTable />
      ) : (
        <div className={styles.pricing}>
          Please <SignUpButton /> to view pricing table
        </div>
      )}
    </>
  )
}
