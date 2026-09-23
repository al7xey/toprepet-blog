'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="page-shell py-24 text-center"><h1 className="text-3xl font-extrabold">Не удалось загрузить страницу</h1><p className="mt-4 text-[#697383]">Повторите попытку. Если ошибка останется, сообщите в поддержку TopRepet.</p><button type="button" className="button-primary mt-7" onClick={reset}>Повторить</button></main>
}
