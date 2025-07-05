import { Container } from '@/components/UI'
import Chat from '@/components/Chat/Chat'
import Footer from '@/components/Footer/Footer'
import { getTokensFromDB } from '@/lib/User/User.service'
import { TokensProvider } from '@/contexts/TokensContext'

export default async function Home() {
  const tokens = await getTokensFromDB()
  return (
    <Container>
      <TokensProvider>
        <Chat />
        <Footer />
      </TokensProvider>
    </Container>
  )
}
