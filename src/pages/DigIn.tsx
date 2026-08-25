import { Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import type { Format, Genre } from '../types'

const FORMATS: Format[] = ['LP', '12"', '7"']
const GENRES: Genre[] = ['90s R&B', 'New Jack Swing', 'Hip-Hop', 'Soul/Funk', 'Others']
const COLOR_BY_GENRE: Record<Genre, [string, string]> = {
  '90s R&B': ['#7c3aed', '#db2777'],
  'New Jack Swing': ['#2563eb', '#06b6d4'],
  'Hip-Hop': ['#ea580c', '#dc2626'],
  'Soul/Funk': ['#b45309', '#eab308'],
  Others: ['#0f766e', '#16a34a'],
}

export function DigIn() {
  const { addDigLogEntry, addRecord } = useApp()
  const navigate = useNavigate()

  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<Format>('LP')
  const [store, setStore] = useState('')
  const [area, setArea] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [gotIt, setGotIt] = useState(true)
  const [genre, setGenre] = useState<Genre>('90s R&B')

  const canSubmit = artist && title && store && area

  function submit() {
    const color = COLOR_BY_GENRE[genre]
    addDigLogEntry({
      artist,
      title,
      format,
      color,
      store,
      area,
      price: price ? Number(price) : undefined,
      date: new Date().toISOString().slice(0, 10),
      note: note || undefined,
    })
    if (gotIt) {
      addRecord({ artist, title, format, genre, price: price ? Number(price) : undefined, store, color })
    }
    navigate('/log')
  }

  return (
    <Screen title="DIG IN" subtitle="発見したレコードを記録しよう" back>
      <div className="space-y-3">
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="アーティスト" className="input" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" className="input" />

        <div>
          <p className="mb-1.5 text-[11px] font-medium text-white/40">フォーマット</p>
          <div className="flex gap-2">
            {FORMATS.map((f) => (
              <Pill key={f} active={format === f} onClick={() => setFormat(f)}>
                {f}
              </Pill>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="店舗名" className="input" />
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="エリア（例: 横浜）" className="input" />
        </div>

        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="価格（任意）" className="input" />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="コメント（任意・在庫状況など）"
          rows={2}
          className="input resize-none"
        />

        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <input type="checkbox" checked={gotIt} onChange={(e) => setGotIt(e.target.checked)} className="size-4 accent-fuchsia-500" />
          <span className="text-sm text-white/75">この盤を持ち帰った（コレクションにも追加する）</span>
        </label>

        {gotIt && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-white/40">ジャンル</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {GENRES.map((g) => (
                <Pill key={g} active={genre === g} onClick={() => setGenre(g)}>
                  {g}
                </Pill>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/40 disabled:opacity-40"
        >
          <Check className="size-4" />
          投稿する
        </button>
      </div>
    </Screen>
  )
}
