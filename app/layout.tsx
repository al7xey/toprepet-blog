import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
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
  return <html lang="ru"><body><SiteHeader/>{children}<footer className="site-footer"><div className="page-shell footer-inner"><span>© TopRepet</span><nav aria-label="Навигация в подвале"><Link href="/">Блог</Link><Link href="/#directions">Направления</Link><Link href="/#fresh">Статьи</Link><a href="https://toprepet.ru/">Основной сайт</a></nav></div></footer><Suspense fallback={null}><Metrika/></Suspense></body></html>
}
