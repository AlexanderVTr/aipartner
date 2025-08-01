import { Container } from '@/components/UI'
import Chat from '@/components/Chat/Chat'
import Footer from '@/components/Footer/Footer'
import { TokensProvider } from '@/contexts/TokensContext'

export default async function Home() {
  return (
    <div className='chat-page'>
      <Container>
        <TokensProvider>
          <Chat />
          <Footer />
        </TokensProvider>
      </Container>
      <div className='shade'></div>
      <div className='shade2'></div>
    </div>
  )
}
