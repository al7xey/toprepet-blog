'use client'

export default function AdminError({ reset }: { reset: () => void }) {
  return <main className="paper p-7"><h1 className="text-2xl font-extrabold">Операция не выполнена</h1><p className="mt-3 text-sm text-[#697383]">Данные не были изменены. Обновите страницу и повторите.</p><button type="button" className="button-primary mt-6" onClick={reset}>Повторить</button></main>
}
