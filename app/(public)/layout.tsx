import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><SiteHeader/>{children}<footer className="site-footer"><div className="page-shell footer-inner"><span>© TopRepet</span><nav aria-label="Навигация в подвале"><Link href="/">Блог</Link><Link href="/#directions">Направления</Link><Link href="/#fresh">Статьи</Link><a href="https://toprepet.ru/">Основной сайт</a></nav></div></footer></>
}
