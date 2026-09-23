'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { transliterate } from 'transliteration'
import type { Article, Category } from '@/lib/types'
import { compressImage } from '@/lib/compress-image'
import { RichEditor } from './rich-editor'

const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] }
export function ArticleForm({ article, categories }: { article?: Article; categories: Category[] }) {
  const router = useRouter()
  const [id, setId] = useState(article?.id || '')
  const idRef = useRef(article?.id || '')
  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [slugTouched, setSlugTouched] = useState(Boolean(article))
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [categoryId, setCategoryId] = useState(article?.category_id || '')
  const [seoTitle, setSeoTitle] = useState(article?.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(article?.seo_description || '')
  const [coverUrl, setCoverUrl] = useState(article?.cover_image_url || '')
  const [coverAlt, setCoverAlt] = useState(article?.cover_image_alt || '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [json, setJson] = useState<Record<string, unknown>>(article?.content_json || emptyDoc)
  const [status, setStatus] = useState<'draft' | 'published'>(article?.status || 'draft')
  const featured = article?.is_featured || false
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  const restoringHistory = useRef(false)
  const pendingImageDeletes = useRef<string[]>([])
  const categoryById = new Map(categories.map(category => [category.id, category]))
  const categoryLabel = (category: Category) => {
    const names = [category.name]
    const visited = new Set([category.id])
    let parentId = category.parent_id
    while (parentId && !visited.has(parentId)) {
      const parent = categoryById.get(parentId)
      if (!parent) break
      names.unshift(parent.name)
      visited.add(parentId)
      parentId = parent.parent_id
    }
    return names.join(' / ')
  }
  const categoryOptions = categories.map(category => ({ id: category.id, label: categoryLabel(category) })).sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  const markDirty = () => { dirtyRef.current = true; setDirty(true) }
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (dirtyRef.current) event.preventDefault() }
    const onClick = (event: MouseEvent) => { const anchor = (event.target as HTMLElement).closest('a'); if (anchor && dirtyRef.current && anchor.href !== location.href && !confirm('Есть несохранённые изменения. Покинуть страницу?')) event.preventDefault() }
    const onPopState = () => {
      if (restoringHistory.current) { restoringHistory.current = false; return }
      if (dirtyRef.current && !confirm('Есть несохранённые изменения. Покинуть страницу?')) { restoringHistory.current = true; history.forward() }
    }
    const onAppLeave = (event: Event) => { if (dirtyRef.current && !confirm('Есть несохранённые изменения. Покинуть страницу?')) event.preventDefault() }
    window.addEventListener('beforeunload', onBeforeUnload); window.addEventListener('popstate', onPopState); window.addEventListener('blog:before-leave', onAppLeave); document.addEventListener('click', onClick, true)
    return () => { window.removeEventListener('beforeunload', onBeforeUnload); window.removeEventListener('popstate', onPopState); window.removeEventListener('blog:before-leave', onAppLeave); document.removeEventListener('click', onClick, true) }
  }, [])
  const payload = (nextStatus: 'draft'|'published') => ({ title, slug, excerpt, category_id: categoryId, seo_title: seoTitle, seo_description: seoDescription, cover_image_url: coverUrl || null, cover_image_alt: coverAlt || null, content_json: json, status: nextStatus, is_featured: featured })
  async function save(nextStatus: 'draft'|'published', quiet = false): Promise<string> {
    if (!title.trim() || !slug.trim() || !categoryId) throw new Error('Укажите заголовок и рубрику')
    const previousId = idRef.current
    const response = await fetch(previousId ? `/api/admin/articles/${previousId}` : '/api/admin/articles', { method: previousId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(nextStatus)) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Не удалось сохранить')
    for (const mediaId of pendingImageDeletes.current) {
      const removed = await fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE' })
      if (!removed.ok) throw new Error('Статья сохранена, но старое изображение не удалось удалить из Storage')
    }
    pendingImageDeletes.current = []
    idRef.current = body.id; setId(body.id); setStatus(nextStatus); dirtyRef.current = false; setDirty(false)
    if (!quiet) setMessage(nextStatus === 'published' ? 'Статья опубликована' : 'Черновик сохранён')
    if (!quiet && !article) router.replace(`/admin/articles/${body.id}`)
    if (!quiet) router.refresh()
    return body.id
  }
  async function perform(nextStatus: 'draft'|'published') { setBusy(true); setMessage(''); try { await save(nextStatus) } catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function preview() { const windowForPreview = window.open('', '_blank'); if (!windowForPreview) { setMessage('Разрешите открытие новой вкладки для предпросмотра'); return } setBusy(true); setMessage(''); try { const response = await fetch('/api/admin/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, excerpt, content_json: json }) }); if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Не удалось открыть предпросмотр') } const url = URL.createObjectURL(new Blob([await response.text()], { type: 'text/html' })); windowForPreview.location.href = url; setTimeout(() => URL.revokeObjectURL(url), 60_000) } catch (error) { windowForPreview.close(); setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function upload(file: File, alt: string, caption: string, cover = false) {
    const articleId = idRef.current || await save('draft', true)
    const image = await compressImage(file, cover)
    const form = new FormData(); form.set('file', image.file); form.set('article_id', articleId); form.set('alt', alt); form.set('caption', caption); form.set('cover', String(cover))
    const response = await fetch('/api/admin/media', { method: 'POST', body: form })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Не удалось загрузить изображение')
    markDirty()
    return { ...body, articleId } as { id: string; url: string; articleId: string }
  }
  async function updateCover(articleId: string, url: string | null) {
    const response = await fetch(`/api/admin/articles/${articleId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload(status), cover_image_url: url, cover_image_alt: url ? coverAlt : null }) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Не удалось сохранить обложку')
    setCoverUrl(url || ''); dirtyRef.current = false; setDirty(false)
  }
  async function deleteCoverMedia(articleId: string, url: string) {
    const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article_id: articleId, url }) })
    if (!response.ok) throw new Error('Статья сохранена, но старый файл не удалён из Storage')
  }
  async function uploadCover() { if (!coverFile) { setMessage('Выберите файл обложки'); return } if (!coverAlt.trim()) { setMessage('Опишите изображение для alt'); return } setBusy(true); setMessage(''); try { const oldUrl = coverUrl; const media = await upload(coverFile, coverAlt.trim(), '', true); try { await updateCover(media.articleId, media.url) } catch (error) { await fetch(`/api/admin/media/${media.id}`, { method: 'DELETE' }); throw error } setCoverFile(null); if (oldUrl) await deleteCoverMedia(media.articleId, oldUrl); setMessage('Обложка обновлена'); if (window.location.pathname.endsWith('/admin/articles/new')) router.replace(`/admin/articles/${media.articleId}`) } catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function removeCover() { if (!id || !coverUrl) return; setBusy(true); setMessage(''); try { const oldUrl = coverUrl; await updateCover(id, null); await deleteCoverMedia(id, oldUrl); setMessage('Обложка удалена') } catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function deleteImage(mediaId: string) { if (!pendingImageDeletes.current.includes(mediaId)) pendingImageDeletes.current.push(mediaId); markDirty() }
  async function removeArticle() { if (!id || !confirm('Удалить статью и все её изображения?')) return; const response = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' }); if (response.ok) { dirtyRef.current = false; router.push('/admin/articles'); router.refresh() } else setMessage('Не удалось удалить статью') }
  return <main className="mx-auto max-w-[860px]">
    <Link href="/admin/articles" className="text-link mb-6 inline-block">← Все статьи</Link>
    <div className="mb-8">
      <p className="eyebrow">{id ? 'Редактирование' : 'Новая статья'}</p>
      <h1 className="break-words">{id ? title || 'Статья' : 'Написать статью'}</h1>
      <p className="mt-2 text-sm text-[#697383]">{status === 'published' ? 'Опубликована' : 'Черновик'}{dirty ? ' · Есть несохранённые изменения' : ''}</p>
    </div>
    {message && <p role="alert" className="mb-6 rounded-xl bg-[#fff0e5] p-4 text-sm">{message}</p>}
    <section className="paper space-y-5 p-5 sm:p-8" aria-labelledby="article-main-heading">
      <h2 id="article-main-heading" className="text-xl font-bold">Основное</h2>
      <div>
        <label className="label" htmlFor="article-title">Заголовок</label>
        <input id="article-title" required className="field text-lg font-semibold" value={title} placeholder="О чём будет статья?" onChange={event => { setTitle(event.target.value); if (!slugTouched) setSlug(transliterate(event.target.value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); markDirty() }}/>
      </div>
      <div>
        <label className="label" htmlFor="article-category">Рубрика</label>
        <select id="article-category" className="field" value={categoryId} onChange={event => { setCategoryId(event.target.value); markDirty() }}>
          <option value="">Выберите рубрику</option>
          {categoryOptions.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
        </select>
        {!categories.length && <p className="mt-2 text-sm text-[#697383]">Сначала <Link className="text-link" href="/admin/categories">создайте рубрику</Link>.</p>}
      </div>
    </section>
    <section className="mt-8" aria-labelledby="article-body-heading">
      <h2 id="article-body-heading" className="mb-3 text-xl font-bold">Текст статьи</h2>
      <RichEditor initial={json} onChange={value => { setJson(value); markDirty() }} onUpload={(file, alt, caption) => upload(file, alt, caption)} onDeleteImage={deleteImage}/>
    </section>
    <details className="paper mt-8 p-5 sm:p-8">
      <summary className="cursor-pointer text-lg font-bold">Обложка <span className="ml-2 text-sm font-normal text-[#697383]">необязательно</span></summary>
      <div className="mt-5 space-y-4">
        {coverUrl && <Image src={coverUrl} alt={coverAlt || 'Обложка статьи'} width={720} height={405} unoptimized className="aspect-video w-full rounded-xl object-cover"/>}
        <div><label className="label" htmlFor="cover-file">Выбрать изображение</label><input id="cover-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setCoverFile(event.target.files?.[0] || null)}/></div>
        <div><label className="label" htmlFor="cover-alt">Что изображено</label><input id="cover-alt" className="field" value={coverAlt} onChange={event => { setCoverAlt(event.target.value); markDirty() }}/><p className="mt-2 text-xs text-[#697383]">Описание нужно для доступности и поиска.</p></div>
        <div className="flex flex-wrap items-center gap-4"><button type="button" className="button-outline" disabled={!coverFile || busy} onClick={uploadCover}>{coverUrl ? 'Заменить обложку' : 'Добавить обложку'}</button>{coverUrl && <button type="button" className="text-sm text-red-700 underline" disabled={busy} onClick={removeCover}>Удалить обложку</button>}</div>
      </div>
    </details>
    <details className="paper mt-4 p-5 sm:p-8">
      <summary className="cursor-pointer text-lg font-bold">Адрес и настройки <span className="ml-2 text-sm font-normal text-[#697383]">необязательно</span></summary>
      <div className="mt-5 space-y-5">
        <div><label className="label" htmlFor="article-excerpt">Краткое описание</label><textarea id="article-excerpt" rows={3} className="field" value={excerpt} placeholder="Если оставить пустым, возьмём начало статьи" onChange={event => { setExcerpt(event.target.value); markDirty() }}/><p className="mt-2 text-xs text-[#697383]">Используется в карточке статьи и под заголовком.</p></div>
        <div><label className="label" htmlFor="article-slug">Адрес статьи</label><div className="flex items-center gap-2"><span className="hidden text-sm text-[#687482] sm:block">/articles/</span><input id="article-slug" className="field" pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={event => { setSlugTouched(true); setSlug(event.target.value); markDirty() }}/></div><p className="mt-2 text-xs text-[#697383]">Формируется из заголовка. Можно изменить до публикации.</p></div>
        <div><label className="label" htmlFor="seo-title">Заголовок для поиска</label><input id="seo-title" className="field" value={seoTitle} placeholder="По умолчанию — заголовок статьи" onChange={event => { setSeoTitle(event.target.value); markDirty() }}/></div>
        <div><label className="label" htmlFor="seo-description">Описание для поиска</label><textarea id="seo-description" rows={3} className="field" value={seoDescription} placeholder="По умолчанию — краткое описание" onChange={event => { setSeoDescription(event.target.value); markDirty() }}/></div>
      </div>
    </details>
    <div className="paper mt-8 p-5 sm:p-8">
      <p className="mb-5 text-sm text-[#697383]">Для публикации нужны заголовок, рубрика и текст.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} className="button-primary" onClick={() => perform('published')}>{busy ? 'Сохраняем…' : status === 'published' ? 'Сохранить изменения' : 'Опубликовать'}</button>
        {status === 'draft' && <button type="button" disabled={busy} className="button-outline" onClick={() => perform('draft')}>Сохранить черновик</button>}
        <button type="button" disabled={busy} className="button-outline" onClick={preview}>Предпросмотр</button>
      </div>
      {id && <div className="mt-6 flex flex-wrap gap-6 border-t border-[#eee5de] pt-5 text-sm">{status === 'published' && <button type="button" disabled={busy} className="text-[#697383] underline" onClick={() => perform('draft')}>Снять с публикации</button>}<button type="button" disabled={busy} className="text-red-700 underline" onClick={removeArticle}>Удалить статью</button></div>}
    </div>
  </main>
}
