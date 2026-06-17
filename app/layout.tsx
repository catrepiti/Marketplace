import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'merly', template: '%s · merly' },
  description: 'Análise inteligente de marketplaces — Dashboard financeiro, precificador automático e monitoramento de reputação',
  metadataBase: new URL('https://merly.com.br'),
  themeColor: '#0080ff',
  icons: {
    icon:  [{ url: '/icon', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={jakarta.variable}>
      <body>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
