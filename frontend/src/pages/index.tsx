import { Inter } from '@next/font/google'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <Head>
        <title>AO3 Archives</title>
        <meta property='description'>Because the "archive" in AO3 is a false statement</meta>
        <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
      </Head>
      <div className='min-h-screen w-screen bg-white'>

      </div>
    </>
  )
}
