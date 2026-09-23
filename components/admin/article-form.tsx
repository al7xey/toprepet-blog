'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { transliterate } from 'transliteration'
import type { Article, Category } from '@/lib/types'
import { compressImage } from '@/lib/compress-image'
import { RichEditor } from './rich-editor'

const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] }
export function ArticleForm({ article, categories }: { article?: Article; categories: Category[] }) {
  const router = useRouter()
  const [id, setId] = useState(article?.id || '')
  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [slugTouched, setSlugTouched] = useState(Boolean(article))
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [categoryId, setCategoryId] = useState(article?.category_id || categories[0]?.id || '')
  const [seoTitle, setSeoTitle] = useState(article?.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(article?.seo_description || '')
  const [coverUrl, setCoverUrl] = useState(article?.cover_image_url || '')
  const [coverAlt, setCoverAlt] = useState(article?.cover_image_alt || '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [json, setJson] = useState<Record<string, unknown>>(article?.content_json || emptyDoc)
  const [status, setStatus] = useState<'draft' | 'published'>(article?.status || 'draft')
  const [featured, setFeatured] = useState(article?.is_featured || false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  const restoringHistory = useRef(false)
  const pendingImageDeletes = useRef<string[]>([])
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
    if (!title.trim() || !slug.trim() || !categoryId) throw new Error('Укажите заголовок, адрес и рубрику')
    const response = await fetch(id ? `/api/admin/articles/${id}` : '/api/admin/articles', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(nextStatus)) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Не удалось сохранить')
    for (const mediaId of pendingImageDeletes.current) {
      const removed = await fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE' })
      if (!removed.ok) throw new Error('Статья сохранена, но старое изображение не удалось удалить из Storage')
    }
    pendingImageDeletes.current = []
    setId(body.id); setStatus(nextStatus); dirtyRef.current = false; setDirty(false)
    if (!quiet) setMessage(nextStatus === 'published' ? 'Статья опубликована' : 'Черновик сохранён')
    if (!id) router.replace(`/admin/articles/${body.id}`)
    router.refresh()
    return body.id
  }
  async function perform(nextStatus: 'draft'|'published') { setBusy(true); setMessage(''); try { await save(nextStatus) } catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function preview() { const windowForPreview = window.open('', '_blank'); if (!windowForPreview) { setMessage('Разрешите открытие новой вкладки для предпросмотра'); return } setBusy(true); setMessage(''); try { const response = await fetch('/api/admin/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, excerpt, content_json: json }) }); if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Не удалось открыть предпросмотр') } const url = URL.createObjectURL(new Blob([await response.text()], { type: 'text/html' })); windowForPreview.location.href = url; setTimeout(() => URL.revokeObjectURL(url), 60_000) } catch (error) { windowForPreview.close(); setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function upload(file: File, alt: string, caption: string, cover = false) {
    if (!id) throw new Error('Сначала сохраните черновик, затем добавьте изображение')
    const articleId = id
    const image = await compressImage(file, cover)
    const form = new FormData(); form.set('file', image.file); form.set('article_id', articleId); form.set('alt', alt); form.set('caption', caption); form.set('cover', String(cover))
    const response = await fetch('/api/admin/media', { method: 'POST', body: form })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Не удалось загрузить изображение')
    markDirty()
    return body as { id: string; url: string }
  }
  async function updateCover(url: string | null) {
    const response = await fetch(`/api/admin/articles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload(status), cover_image_url: url, cover_image_alt: url ? coverAlt : null }) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Не удалось сохранить обложку')
    setCoverUrl(url || ''); dirtyRef.current = false; setDirty(false); router.refresh()
  }
  async function deleteCoverMedia(url: string) {
    const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article_id: id, url }) })
    if (!response.ok) throw new Error('Статья сохранена, но старый файл не удалён из Storage')
  }
  async function uploadCover() { if (!coverFile) { setMessage('Выберите файл обложки'); return } if (!coverAlt.trim()) { setMessage('Добавьте alt для обложки'); return } setBusy(true); setMessage(''); try { const oldUrl = coverUrl; const media = await upload(coverFile, coverAlt.trim(), '', true); try { await updateCover(media.url) } catch (error) { await fetch(`/api/admin/media/${media.id}`, { method: 'DELETE' }); throw error } setCoverFile(null); if (oldUrl) await deleteCoverMedia(oldUrl); setMessage('Обложка обновлена') } catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function removeCover() { if (!id || !coverUrl) return; setBusy(true); setMessage(''); try { const oldUrl = coverUrl; await updateCover(null); await deleteCoverMedia(oldUrl); setMessage('Обложка удалена') } catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка') } finally { setBusy(false) } }
  async function deleteImage(mediaId: string) { if (!pendingImageDeletes.current.includes(mediaId)) pendingImageDeletes.current.push(mediaId); markDirty() }
  async function removeArticle() { if (!id || !confirm('Удалить статью и все её изображения?')) return; const response = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' }); if (response.ok) { dirtyRef.current = false; router.push('/admin/articles'); router.refresh() } else setMessage('Не удалось удалить статью') }
  return <main><div className="admin-page-heading mb-8"><div className="min-w-0"><p className="eyebrow">{id ? 'Редактирование' : 'Новый материал'}</p><h1 className="break-words">{title || 'Новая статья'}</h1><p>{status === 'published' ? 'Опубликована' : 'Черновик'}{dirty ? ' · Есть несохранённые изменения' : ''}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} className="button-outline" onClick={()=>perform(status)}>Сохранить</button><button type="button" disabled={busy} className="button-outline" onClick={preview}>Предпросмотр</button>{status === 'published' && <button type="button" disabled={busy} className="button-outline" onClick={()=>perform('draft')}>Снять с публикации</button>}<button type="button" disabled={busy} className="button-primary" onClick={()=>perform('published')}>Опубликовать</button></div></div>
    {message && <p role="status" className="mb-6 rounded-xl bg-[#fff0e5] p-4 text-sm">{message}</p>}
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-6"><div className="paper space-y-5 p-6"><div><label className="label" htmlFor="article-title">Заголовок H1</label><input id="article-title" required className="field text-xl font-bold" value={title} onChange={e=>{setTitle(e.target.value); if(!slugTouched) setSlug(transliterate(e.target.value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')); markDirty()}}/></div><div><label className="label" htmlFor="article-slug">Адрес статьи</label><div className="flex items-center gap-2"><span className="hidden text-sm text-[#687482] sm:block">/articles/</span><input id="article-slug" className="field" pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e=>{setSlugTouched(true);setSlug(e.target.value);markDirty()}}/></div></div><div><label className="label" htmlFor="article-excerpt">Анонс / lead</label><textarea id="article-excerpt" rows={4} className="field" value={excerpt} onChange={e=>{setExcerpt(e.target.value);markDirty()}}/></div></div><div><h2 className="mb-3 text-xl font-bold">Текст статьи</h2><RichEditor initial={json} onChange={value=>{setJson(value); markDirty()}} onUpload={(file,alt,caption)=>upload(file,alt,caption)} onDeleteImage={deleteImage}/></div></div>
    <aside className="space-y-6"><div className="paper space-y-4 p-6"><h2 className="text-xl font-bold">Публикация</h2><div><label className="label" htmlFor="article-category">Рубрика</label><select id="article-category" className="field" value={categoryId} onChange={e=>{setCategoryId(e.target.value);markDirty()}}><option value="">Выберите рубрику</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={e=>{setFeatured(e.target.checked);markDirty()}}/> Рекомендовать на главной</label></div><div className="paper space-y-4 p-6"><h2 className="text-xl font-bold">Обложка</h2>{coverUrl && <Image src={coverUrl} alt={coverAlt || 'Обложка статьи'} width={320} height={180} unoptimized className="aspect-video w-full rounded-xl object-cover"/>}<p className="text-xs text-[#687482]">Рекомендуем 16:9. До 1600×900, WebP после сжатия.</p><div><label className="label" htmlFor="cover-file">Файл</label><input id="cover-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setCoverFile(e.target.files?.[0] || null)}/></div><div><label className="label" htmlFor="cover-alt">Alt</label><input id="cover-alt" className="field" value={coverAlt} onChange={e=>{setCoverAlt(e.target.value);markDirty()}}/></div><button type="button" className="button-outline" disabled={!coverFile || busy} onClick={uploadCover}>Загрузить обложку</button>{coverUrl && <button type="button" className="block text-sm text-red-700" onClick={removeCover}>Убрать из статьи и Storage</button>}</div><div className="paper space-y-4 p-6"><h2 className="text-xl font-bold">SEO</h2><div><label htmlFor="seo-title" className="label">SEO title</label><input id="seo-title" className="field" value={seoTitle} onChange={e=>{setSeoTitle(e.target.value);markDirty()}}/></div><div><label htmlFor="seo-description" className="label">SEO description</label><textarea id="seo-description" rows={3} className="field" value={seoDescription} onChange={e=>{setSeoDescription(e.target.value);markDirty()}}/></div></div>{id && <button type="button" className="text-sm text-red-700 underline" onClick={removeArticle}>Удалить статью</button>}</aside></div>
  </main>
}
