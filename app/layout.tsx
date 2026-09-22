import type { Metadata } from 'next'
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
  return <html lang="ru"><body><SiteHeader/>{children}<footer className="mt-24 border-t border-[#eee7de] px-5 py-10 text-sm text-[#6d7985]"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4"><span>© TopRepet · Блог об учёбе</span><a href="https://toprepet.ru/" className="hover:text-[#df5b27]">Подобрать репетитора ↗</a></div></footer><Metrika/></body></html>
}
