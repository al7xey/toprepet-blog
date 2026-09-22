import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { renderContent } from '@/lib/content'
import type { Article } from '@/lib/types'
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default async function Preview({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const { supabase } = await requireAdmin(); const { data } = await supabase.from('articles').select('*').eq('id', id).maybeSingle(); if (!data) notFound(); const article = data as Article; const { html } = renderContent(article.content_json); return <main className="mx-auto max-w-[820px]"><div className="mb-8 rounded-xl bg-[#fff0e5] p-4 text-sm">Предпросмотр · <Link href={`/admin/articles/${id}`} className="font-bold underline">Вернуться к редактору</Link></div><h1 className="text-4xl font-extrabold sm:text-6xl">{article.title}</h1><p className="mt-6 text-xl text-[#687482]">{article.excerpt}</p>{article.cover_image_url && <Image src={article.cover_image_url} alt={article.cover_image_alt || ''} width={1600} height={900} unoptimized className="my-8 h-auto w-full rounded-2xl"/>}<section className="article-body mt-10" dangerouslySetInnerHTML={{ __html: html }}/></main> }
