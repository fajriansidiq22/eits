import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EITS — English Intelligent Test Studio',
  description: 'Latihan soal bahasa Inggris dengan AI. Generate soal Reading dan Grammar beserta pembahasan lengkap.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
