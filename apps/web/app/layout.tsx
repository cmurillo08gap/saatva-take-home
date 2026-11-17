import type { Metadata } from 'next'
import { Questrial, Source_Serif_4 } from 'next/font/google'
import { CartNotice } from '@/components/CartNotice'
import { CartProvider } from '@/components/CartProvider'
import { Header } from '@/components/Header'
import './globals.css'

const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' })
const body = Questrial({ subsets: ['latin'], weight: '400', variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Saatva | Choose Your Mattress',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${body.variable}`}>
      <body>
        <CartProvider>
          <Header />
          <CartNotice />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  )
}
