'use client'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { LogoutButton } from './logout-button'

export function AdminHeader() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return <header className="admin-header"><div className="page-shell admin-header-inner"><Link href="/admin" className="admin-brand" onClick={close}><strong>TopRepet</strong><span>Админка</span></Link><button type="button" className="admin-menu-button" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X/> : <Menu/>}</button><nav className={open ? 'admin-nav is-open' : 'admin-nav'} aria-label="Навигация редакции"><Link href="/admin" onClick={close}>Обзор</Link><Link href="/admin/articles" onClick={close}>Статьи</Link><Link href="/admin/categories" onClick={close}>Рубрики</Link><Link href="/" onClick={close}>Открыть блог</Link><LogoutButton/></nav></div></header>
}
