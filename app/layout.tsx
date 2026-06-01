import { DemoBanner } from '@/components/shared/demo-banner'
import { AuthProvider } from '@/lib/auth-context'
import { LanguageProvider } from '@/lib/language-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { ThemeProvider } from '@/lib/theme-context'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SIMS - Student Information Management System',
  description: 'Comprehensive school management system with biometric attendance, course management, and real-time notifications.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
                <NotificationsProvider>
                  <DemoBanner />
                  {children}
                </NotificationsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
