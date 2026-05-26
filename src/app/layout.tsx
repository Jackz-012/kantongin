import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Kantongin — Aplikasi Tabungan Pribadi',
  description: 'Kelola tabungan pribadi Anda dengan mudah dan cerdas. Catat setiap pemasukan dan pengeluaran dalam satu aplikasi.',
  keywords: ['tabungan', 'keuangan pribadi', 'pengelolaan uang', 'kantongin'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2236',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0a0f1e' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#0a0f1e' } },
          }}
        />
      </body>
    </html>
  )
}
