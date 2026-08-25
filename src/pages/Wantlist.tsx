import { Eye, EyeOff, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RecordCover } from '../components/RecordCover'
import { Screen } from '../components/Screen'
import { Card, EmptyState, Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import { relativeDate, yen } from '../lib/format'
import type { Format } from '../types'

type FilterKey = 'all' | 'sighted' | 'unconfirmed'

const FILTERS: { label: string; value: FilterKey }[] = [
  { label: 'すべて', value: 'all' },
  { label: '目撃情報あり', value: 'sighted' },
  { label: '未確認', value: 'unconfirmed' },
]

export function Wantlist() {
  const { wantlist, removeWant, addWant, addSighting } = useApp()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sightingFormFor, setSightingFormFor] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'sighted') return wantlist.filter((w) => w.sightings.length > 0)
    if (filter === 'unconfirmed') return wantlist.filter((w) => w.sightings.length === 0)
    return wantlist
  }, [wantlist, filter])

  return (
    <Screen
      title="Wantlist"
      subtitle={`${wantlist.length}枚`}
      right={
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="flex size-9 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/40"
          aria-label="Wantを追加"
        >
          {showForm ? <X className="size-5" /> : <Plus className="size-5" />}
        </button>
      }
    >
      {showForm && <AddWantForm onSubmit={(v) => { addWant(v); setShowForm(false) }} />}

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Pill key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Pill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="該当するWantがありません" />
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <Card key={w.id}>
              <div className="flex items-start gap-3">
                <RecordCover color={w.color} artist={w.artist} title={w.title} format={w.format} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.artist}</p>
                  <p className="truncate text-xs text-white/55">{w.title}</p>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => (e === w.id ? null : w.id))}
                    className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${
                      w.sightings.length > 0 ? 'text-emerald-400' : 'text-white/35'
                    }`}
                  >
                    {w.sightings.length > 0 ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                    {w.sightings.length > 0
                      ? `${w.sightings[0].area}で${w.sightings.length}件の目撃情報`
                      : '目撃情報なし'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeWant(w.id)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/25 hover:bg-white/10 hover:text-white/60"
                  aria-label="削除"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {expanded === w.id && (
                <div className="mt-3 border-t border-white/8 pt-3">
                  {w.sightings.length > 0 && (
                    <ul className="mb-2 space-y-2">
                      {w.sightings.map((s) => (
                        <li key={s.id} className="flex items-center justify-between text-xs">
                          <span className="text-white/60">
                            {s.store}・{s.area}・{relativeDate(s.date)}
                          </span>
                          <span className="font-medium text-white/80">{yen(s.price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {sightingFormFor === w.id ? (
                    <SightingForm
                      onCancel={() => setSightingFormFor(null)}
                      onSubmit={(v) => {
                        addSighting(w.id, { ...v, date: new Date().toISOString().slice(0, 10) })
                        setSightingFormFor(null)
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSightingFormFor(w.id)}
                      className="text-[11px] font-medium text-fuchsia-300"
                    >
                      + 自分の目撃情報を記録する
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Screen>
  )
}

function SightingForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: { store: string; area: string; price?: number }) => void
  onCancel: () => void
}) {
  const [store, setStore] = useState('')
  const [area, setArea] = useState('')
  const [price, setPrice] = useState('')

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="店舗名" className="input" />
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="エリア" className="input" />
      </div>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="価格（任意）"
        className="input"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-white/50">
          キャンセル
        </button>
        <button
          type="button"
          disabled={!store || !area}
          onClick={() => onSubmit({ store, area, price: price ? Number(price) : undefined })}
          className="flex-1 rounded-xl bg-fuchsia-500 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          記録する
        </button>
      </div>
    </div>
  )
}

function AddWantForm({
  onSubmit,
}: {
  onSubmit: (v: { artist: string; title: string; format: Format }) => void
}) {
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<Format>('12"')

  return (
    <Card className="mb-4 space-y-2.5">
      <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="アーティスト" className="input" />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" className="input" />
      <div className="flex gap-2">
        {(['LP', '12"', '7"'] as Format[]).map((f) => (
          <Pill key={f} active={format === f} onClick={() => setFormat(f)}>
            {f}
          </Pill>
        ))}
      </div>
      <button
        type="button"
        disabled={!artist || !title}
        onClick={() => onSubmit({ artist, title, format })}
        className="w-full rounded-xl bg-fuchsia-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        Wantに追加
      </button>
    </Card>
  )
}
