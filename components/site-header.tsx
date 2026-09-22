import Link from 'next/link'
import { MAIN_URL } from '@/lib/config'

function Logo() {
  return <Link href="/" className="brand" aria-label="TopRepet — блог">
    <svg className="brand-symbol" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect width="36" height="36" rx="12" fill="currentColor"/>
      <path d="M17 9v14a4 4 0 0 0 4 4h3M11 15h13" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span>toprepet</span>
  </Link>
}

export function SiteHeader() {
  return <header className="site-header">
    <div className="page-shell header-inner">
      <Logo/>
      <nav aria-label="Основная навигация" className="header-nav">
        <Link href="/">Главная</Link>
        <a href={MAIN_URL}>Занятия</a>
      </nav>
      <a href={MAIN_URL} className="button-primary header-contact"><span className="header-contact-full">Найти репетитора</span><span className="header-contact-short">Занятия</span></a>
    </div>
  </header>
}
