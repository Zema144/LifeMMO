import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from "@/components/auth-provider"
import type { Metadata, Viewport } from 'next'
import { Press_Start_2P, VT323 } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const vt323 = VT323({ subsets: ['latin'], weight: '400', variable: '--font-body' })
const pressStart = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-pixel' })

export const metadata: Metadata = {
  title: 'Life MMO — Level Up Your Life',
  description: 'A gamified Life RPG. Complete quests, earn XP, and level up your real-life skills.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${vt323.variable} ${pressStart.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans antialiased">
        <AuthProvider>
          <Providers>{children}</Providers>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
