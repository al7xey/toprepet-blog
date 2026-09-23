import type { Heading } from '@/lib/content'

function Links({ headings }: { headings: Heading[] }) { return <ol className="space-y-3 text-sm">{headings.map(h => <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}><a href={`#${h.id}`} className="text-[#52616e] hover:text-[#df5b27]">{h.text}</a></li>)}</ol> }
export function ArticleToc({ headings, variant }: { headings: Heading[]; variant: 'mobile' | 'desktop' }) {
  if (headings.length < 3) return null
  if (variant === 'mobile') return <details className="paper mb-8 p-5 lg:hidden"><summary className="cursor-pointer font-bold">Содержание</summary><nav aria-label="Содержание статьи" className="mt-4"><Links headings={headings}/></nav></details>
  return <aside className="hidden lg:block"><nav aria-label="Содержание статьи" className="sticky top-8 max-h-[80vh] overflow-auto"><h2 className="mb-4 font-bold">Содержание</h2><Links headings={headings}/></nav></aside>
}
