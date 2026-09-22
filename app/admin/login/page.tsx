import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/login-form'
export const metadata: Metadata = { title: 'Вход в редакцию — TopRepet', robots: { index: false, follow: false } }
export default function LoginPage() { return <main className="page-shell flex min-h-[70vh] items-center justify-center py-16"><div className="paper w-full max-w-[430px] p-7 sm:p-10"><span className="eyebrow">Редакция TopRepet</span><h1 className="mt-4 text-3xl font-extrabold tracking-[-.045em]">Вход в редакцию</h1><p className="mt-3 text-sm leading-6 text-[#697383]">Используйте аккаунт администратора, чтобы управлять статьями и рубриками.</p><LoginForm/></div></main> }
