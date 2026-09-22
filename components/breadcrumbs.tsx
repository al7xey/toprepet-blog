import Link from 'next/link'
import type { Category } from '@/lib/types'
import { categoryPath, rubricHref } from '@/lib/data'

export function Breadcrumbs({ category, categories, articleTitle }: { category?: Category | null; categories: Category[]; articleTitle?: string }) {
  const items = category ? categoryPath(category, categories) : []
  return <nav aria-label="Навигационная цепочка" className="mb-8 text-sm text-[#6d7985]"><ol className="flex flex-wrap items-center gap-2"><li><Link href="/" className="hover:text-[#df5b27]">Блог</Link></li>{items.map(item => <li key={item.id} className="flex items-center gap-2"><span aria-hidden="true">/</span><Link href={rubricHref(item, categories)} className="hover:text-[#df5b27]">{item.name}</Link></li>)}{articleTitle && <li className="flex items-center gap-2"><span aria-hidden="true">/</span><span aria-current="page" className="text-[#182331]">{articleTitle}</span></li>}</ol></nav>
}
