import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RETIAS — Dashboard',
  description: 'Real Time Interview Assistant Software — Web Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
