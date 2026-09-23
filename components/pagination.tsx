import Link from 'next/link'

export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null
  return <nav className="pagination" aria-label="Страницы">
    {page > 1 && <Link rel="prev" href={href(page - 1)}>← Новее</Link>}
    <span>Страница {page} из {pageCount}</span>
    {page < pageCount && <Link rel="next" href={href(page + 1)}>Дальше →</Link>}
  </nav>
}
