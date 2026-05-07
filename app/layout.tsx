import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { PWARegister } from '@/components/pwa-register'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinanceTrack - Gestore Finanze Personali',
  description: 'Gestisci le tue finanze personali e di business con semplicità. Traccia entrate, spese, investimenti e abbonamenti ricorrenti.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinanceTrack',
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    shortcut: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
  other: {
    'theme-color': '#22c55e',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'FinanceTrack',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#22c55e',
    'msapplication-config': '/browserconfig.xml',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
        <PWARegister />
      </body>
    </html>
  )
}
