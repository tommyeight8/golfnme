import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'Fairway | Golf Score Tracker',
  description: 'Track your golf scores, compete with friends, and improve your game.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sand-50 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
