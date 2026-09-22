import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/login-form'
export const metadata: Metadata = { title: 'Вход в редакцию — TopRepet', robots: { index: false, follow: false } }
export default function LoginPage() { return <main className="page-shell flex min-h-[70vh] items-center justify-center py-16"><div className="paper w-full max-w-[430px] p-7 sm:p-10"><h1 className="text-3xl font-extrabold tracking-[-.045em]">Вход в редакцию</h1><p className="mt-3 text-sm leading-6 text-[#667085]">Войдите с email и паролем администратора TopRepet.</p><LoginForm/></div></main> }
