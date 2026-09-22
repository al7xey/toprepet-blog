import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/login-form'
export const metadata: Metadata = { title: 'Вход в редакцию — TopRepet', robots: { index: false, follow: false } }
export default function LoginPage() { return <main className="mx-auto max-w-md px-5 py-20"><div className="paper p-8"><span className="text-sm font-bold uppercase tracking-widest text-[#df5b27]">Редакция</span><h1 className="mt-3 text-3xl font-extrabold">Вход в админку</h1><p className="mt-3 text-sm leading-6 text-[#687482]">Войдите с email и паролем администратора TopRepet.</p><LoginForm/></div></main> }
