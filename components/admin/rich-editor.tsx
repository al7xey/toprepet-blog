'use client'
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Minus, Undo2, Redo2, Link2, ImagePlus, Trash2, MoreHorizontal, Images, RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import NextImage from 'next/image'

function ImageView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as { src: string; alt: string; caption?: string; width?: number; height?: number }
  return <NodeViewWrapper as="figure" className={selected ? 'editor-image is-selected' : 'editor-image'} data-drag-handle>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={attrs.src} alt={attrs.alt || ''} width={attrs.width} height={attrs.height}/>
    {attrs.caption && <figcaption>{attrs.caption}</figcaption>}
  </NodeViewWrapper>
}

const BlogImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), caption: { default: null }, mediaId: { default: null }, width: { default: null }, height: { default: null } } },
  addNodeView() { return ReactNodeViewRenderer(ImageView) },
})

type Uploaded = { id: string; url: string; width: number; height: number; alt?: string; caption?: string | null }
type LibraryItem = Uploaded & { status?: string }
export function RichEditor({ initial, articleId, onChange, onUpload, onDeleteImage }: { initial: Record<string, unknown>; articleId?: string; onChange: (json: Record<string, unknown>) => void; onUpload: (file: File, alt: string, caption: string) => Promise<Uploaded>; onDeleteImage: (id: string) => Promise<void> }) {
  const [showUpload, setShowUpload] = useState(false), [showMore, setShowMore] = useState(false), [showLibrary, setShowLibrary] = useState(false)
  const [file, setFile] = useState<File | null>(null), [alt, setAlt] = useState(''), [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(''), [error, setError] = useState(''), [library, setLibrary] = useState<LibraryItem[]>([])
  const openFile = useCallback((value: File) => { setFile(value); setShowUpload(true); setError(''); setProgress('Файл выбран — добавьте alt') }, [])
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, dropcursor: false, gapcursor: false }), BlogImage],
    content: initial, immediatelyRender: false,
    editorProps: {
      attributes: { class: 'article-body ProseMirror px-5 py-6 sm:px-8', role: 'textbox', 'aria-label': 'Текст статьи', tabindex: '0' },
      handleDrop: (_view, event) => { const image = [...(event.dataTransfer?.files || [])].find(item => item.type.startsWith('image/')); if (!image) return false; event.preventDefault(); openFile(image); return true },
      handlePaste: (_view, event) => { const image = [...(event.clipboardData?.files || [])].find(item => item.type.startsWith('image/')); if (!image) return false; event.preventDefault(); openFile(image); return true },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as Record<string, unknown>),
  })
  if (!editor) return <div className="paper p-8">Загружается редактор…</div>
  const imageSelected = editor.isActive('image'), image = imageSelected ? editor.getAttributes('image') : null
  const tool = (label: string, icon: React.ReactNode, action: () => void, active = false, disabled = false) => <button key={label} type="button" title={label} aria-label={label} data-active={active} disabled={disabled} onClick={action}>{icon}</button>
  const insert = (media: Uploaded, imageAlt = alt.trim(), imageCaption = caption.trim()) => editor.chain().focus().insertContent({ type: 'image', attrs: { src: media.url, alt: imageAlt, caption: imageCaption || null, mediaId: media.id, width: media.width, height: media.height } }).run()
  async function upload(event: React.FormEvent) {
    event.preventDefault(); if (!file || !alt.trim()) return
    setBusy(true); setError(''); setProgress('Сжимаем и загружаем…')
    try { const media = await onUpload(file, alt.trim(), caption.trim()); insert(media); setShowUpload(false); setFile(null); setAlt(''); setCaption(''); setProgress('Изображение добавлено') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить изображение'); setProgress('') } finally { setBusy(false) }
  }
  async function loadLibrary() {
    setShowLibrary(value => !value); if (!articleId || library.length) return
    const response = await fetch(`/api/admin/media?article_id=${articleId}`); if (response.ok) setLibrary((await response.json()).items.map((item: Record<string, unknown>) => ({ id: item.id, url: item.public_url, alt: item.alt, caption: item.caption, width: item.width, height: item.height, status: item.status })) as LibraryItem[])
  }
  async function replaceSelected(replacement: Uploaded) {
    if (replacement.id === image?.mediaId) return
    if (image?.mediaId) await onDeleteImage(image.mediaId)
    editor?.commands.updateAttributes('image', { src: replacement.url, alt: replacement.alt || image?.alt || '', caption: replacement.caption || null, mediaId: replacement.id, width: replacement.width, height: replacement.height })
  }
  const editLink = () => { const href = prompt('URL ссылки (https://)', editor.getAttributes('link').href || ''); if (href === null) return; if (!href.trim()) editor.chain().focus().unsetLink().run(); else editor.chain().focus().setLink({ href: href.trim() }).run() }
  const blockStyle = editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'paragraph'
  return <div className="paper overflow-hidden"><div className="editor-toolbar" role="toolbar" aria-label="Форматирование статьи">
    <select aria-label="Стиль текста" value={blockStyle} onChange={event => { const value = event.target.value; if (value === 'h2') editor.chain().focus().setHeading({ level: 2 }).run(); else if (value === 'h3') editor.chain().focus().setHeading({ level: 3 }).run(); else editor.chain().focus().setParagraph().run() }}><option value="paragraph">Обычный текст</option><option value="h2">Заголовок H2</option><option value="h3">Заголовок H3</option></select>
    {tool('Жирный', <Bold size={18}/>, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}{tool('Курсив', <Italic size={18}/>, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}{tool('Ссылка', <Link2 size={18}/>, editLink, editor.isActive('link'))}{tool('Маркированный список', <List size={18}/>, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}{tool('Нумерованный список', <ListOrdered size={18}/>, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}{tool('Добавить изображение', <ImagePlus size={18}/>, () => setShowUpload(value => !value))}{tool('Медиатека', <Images size={18}/>, loadLibrary)}{tool('Отменить', <Undo2 size={18}/>, () => editor.chain().focus().undo().run(), false, !editor.can().undo())}{tool('Ещё', <MoreHorizontal size={18}/>, () => setShowMore(value => !value), showMore)}
  </div>
    {showMore && <div className="editor-more" role="toolbar" aria-label="Дополнительное форматирование">{tool('Жирный курсив', <span className="font-bold italic">BI</span>, () => editor.chain().focus().setBold().setItalic().run(), editor.isActive('bold') && editor.isActive('italic'))}{tool('Зачёркнутый', <Strikethrough size={18}/>, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}{tool('Цитата', <Quote size={18}/>, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}{tool('Разделитель', <Minus size={18}/>, () => editor.chain().focus().setHorizontalRule().run())}{tool('Повторить', <Redo2 size={18}/>, () => editor.chain().focus().redo().run(), false, !editor.can().redo())}</div>}
    <div className="editor-content-shell" onClick={() => editor.chain().focus().run()}><EditorContent editor={editor}/></div>
    <p className="editor-hint">Перетащите изображение сюда или вставьте его из буфера обмена.</p>
    {showUpload && <form onSubmit={upload} className="editor-panel"><div><label className="label" htmlFor="inline-image">Изображение</label><input id="inline-image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => setFile(event.target.files?.[0] || null)}/></div><div><label className="label" htmlFor="inline-alt">Alt — что изображено</label><input id="inline-alt" className="field" required value={alt} onChange={event => setAlt(event.target.value)} maxLength={300}/></div><div><label className="label" htmlFor="inline-caption">Подпись (необязательно)</label><input id="inline-caption" className="field" value={caption} onChange={event => setCaption(event.target.value)} maxLength={400}/></div><button disabled={busy} className="button-primary self-end" type="submit">{busy ? 'Загрузка…' : 'Вставить'}</button>{progress && <p className="text-sm text-[#697383]">{progress}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</form>}
    {showLibrary && <div className="media-library"><p>{articleId ? 'Нажмите на изображение, чтобы вставить его.' : 'Сначала укажите заголовок и тему, затем загрузите изображение.'}</p><div>{library.map(item => <button type="button" key={item.id} onClick={() => imageSelected ? replaceSelected(item) : insert(item, item.alt || '', item.caption || '')}><NextImage src={item.url} alt={item.alt || ''} width={item.width} height={item.height} sizes="140px"/><span>{item.alt}</span></button>)}</div></div>}
    {imageSelected && <div className="editor-panel"><div><label className="label" htmlFor="selected-alt">Alt изображения</label><input id="selected-alt" className="field" value={image?.alt || ''} onChange={event => editor.commands.updateAttributes('image', { alt: event.target.value })}/></div><div><label className="label" htmlFor="selected-caption">Подпись</label><input id="selected-caption" className="field" value={image?.caption || ''} onChange={event => editor.commands.updateAttributes('image', { caption: event.target.value })}/></div><button type="button" className="button-outline w-fit" onClick={loadLibrary}><RefreshCw size={16}/> Заменить</button><button type="button" className="button-outline w-fit text-red-700" onClick={async () => { if (image?.mediaId) await onDeleteImage(image.mediaId); editor.chain().focus().deleteSelection().run() }}><Trash2 size={16}/> Удалить</button></div>}
  </div>
}
