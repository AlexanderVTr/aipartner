import { Container } from '@/components/UI'
import Chat from '@/components/Chat/Chat'
import Footer from '@/components/Footer/Footer'
import { getTokensFromDB } from '@/lib/User/User.service'

export default async function Home() {
  const tokens = await getTokensFromDB()
  return (
    <Container>
      <Chat tokens={tokens} />
      <Footer />
    </Container>
  )
}
