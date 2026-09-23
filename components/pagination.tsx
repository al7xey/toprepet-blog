import Link from 'next/link'

export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null
  return <nav className="pagination" aria-label="Страницы">
    <div>{page > 1 && <Link className="button-outline pagination-button" rel="prev" href={href(page - 1)}>Предыдущая</Link>}</div>
    <span>Страница {page} из {pageCount}</span>
    <div>{page < pageCount && <Link className="button-outline pagination-button" rel="next" href={href(page + 1)}>Следующая</Link>}</div>
  </nav>
}
