import { Button, Container, ThemeToggle } from '@/components/UI'

export default function Home() {
  return (
    <Container>
      <ThemeToggle />

      <Button
        variant='primary'
        href='https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
        target='_blank'
        rel='noopener noreferrer'>
        Deploy now
      </Button>
      <Button
        variant='secondary'
        href='https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app'
        target='_blank'
        rel='noopener noreferrer'>
        Read our docs
      </Button>
    </Container>
  )
}
