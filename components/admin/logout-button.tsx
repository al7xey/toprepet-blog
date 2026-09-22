'use client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { browserSupabase } from '@/lib/supabase-browser'
export function LogoutButton() { const router = useRouter(); return <button type="button" className="inline-flex items-center gap-2 text-sm text-[#667381] hover:text-[#df5b27]" onClick={async () => { await browserSupabase()?.auth.signOut(); router.push('/admin/login'); router.refresh() }}><LogOut size={16}/> Выйти</button> }
