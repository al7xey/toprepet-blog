import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Metrika } from '@/components/metrika'
import { SITE_URL, siteUrl } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Блог TopRepet — знания для вашей цели',
  description: 'Статьи о школьных предметах, подготовке к ОГЭ и ЕГЭ и эффективной учёбе.',
  alternates: { canonical: siteUrl('/') },
  openGraph: { type: 'website', url: siteUrl('/'), siteName: 'Блог TopRepet', title: 'Блог TopRepet — знания для вашей цели', description: 'Полезные материалы об учёбе и экзаменах.', images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/logo.svg' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}<Suspense fallback={null}><Metrika/></Suspense></body></html>
}
