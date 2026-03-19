import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prana Index',
  description: 'Find your Prana Index',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">{children}</body>
    </html>
  )
}
