import { Camera, Check, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecordCover } from '../components/RecordCover'
import { Screen } from '../components/Screen'
import { Card } from '../components/ui'
import { useApp } from '../context/AppContext'
import type { Format, Genre } from '../types'

interface Candidate {
  artist: string
  title: string
  format: Format
  genre: Genre
  label: string
  year: number
  color: [string, string]
}

const RECOGNITION_POOL: Candidate[] = [
  { artist: 'Silk', title: 'Freak Me', format: '12"', genre: 'New Jack Swing', label: 'Elektra', year: 1993, color: ['#2563eb', '#06b6d4'] },
  { artist: 'Xscape', title: "Just Kickin' It", format: '12"', genre: '90s R&B', label: 'So So Def', year: 1993, color: ['#7c3aed', '#db2777'] },
  { artist: 'Gang Starr', title: 'Mass Appeal', format: '12"', genre: 'Hip-Hop', label: 'Chrysalis', year: 1994, color: ['#ea580c', '#dc2626'] },
  { artist: 'Total', title: "Can't You See", format: '12"', genre: '90s R&B', label: 'Bad Boy', year: 1995, color: ['#7c3aed', '#db2777'] },
  { artist: 'Roy Ayers', title: 'Running Away', format: 'LP', genre: 'Soul/Funk', label: 'Polydor', year: 1977, color: ['#b45309', '#eab308'] },
  { artist: 'Groove Theory', title: 'Tell Me', format: '12"', genre: 'New Jack Swing', label: 'Epic', year: 1995, color: ['#2563eb', '#06b6d4'] },
]

const GENRES: Genre[] = ['90s R&B', 'New Jack Swing', 'Hip-Hop', 'Soul/Funk', 'Others']
const FORMATS: Format[] = ['LP', '12"', '7"']

type Step = 'capture' | 'scanning' | 'review'

export function AddRecord() {
  const { addRecord } = useApp()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const poolIndex = useRef(0)

  const [step, setStep] = useState<Step>('capture')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [form, setForm] = useState<Candidate & { price?: string; store?: string; notes?: string }>(() => ({
    ...RECOGNITION_POOL[0],
  }))

  function handlePick(file: File | null) {
    if (file) setPhotoUrl(URL.createObjectURL(file))
    setStep('scanning')
    const candidate = RECOGNITION_POOL[poolIndex.current % RECOGNITION_POOL.length]
    poolIndex.current += 1
    setTimeout(() => {
      setForm({ ...candidate })
      setStep('review')
    }, 1200)
  }

  function reset() {
    setStep('capture')
    setPhotoUrl(null)
  }

  function confirm() {
    addRecord({
      artist: form.artist,
      title: form.title,
      format: form.format,
      genre: form.genre,
      label: form.label || undefined,
      year: form.year || undefined,
      price: form.price ? Number(form.price) : undefined,
      store: form.store || undefined,
      notes: form.notes || undefined,
      color: form.color,
    })
    navigate('/collection')
  }

  return (
    <Screen title="レコードを登録" back>
      {step === 'capture' && (
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] py-16 text-white/50 hover:border-fuchsia-400/40 hover:text-fuchsia-300"
          >
            <Camera className="size-9" strokeWidth={1.5} />
            <span className="text-sm font-medium">ジャケットを撮影する</span>
            <span className="text-[11px] text-white/30">AIがアーティスト・タイトルを自動認識</span>
          </button>
          <button
            type="button"
            onClick={() => handlePick(null)}
            className="mt-3 w-full rounded-xl border border-white/10 py-3 text-center text-xs text-white/45 hover:bg-white/[0.04]"
          >
            サンプル画像で試す
          </button>
        </div>
      )}

      {step === 'scanning' && (
        <div className="flex flex-col items-center gap-4 py-16">
          {photoUrl ? (
            <img src={photoUrl} alt="captured" className="size-40 rounded-2xl object-cover opacity-70" />
          ) : (
            <div className="flex size-40 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              <Camera className="size-10 text-white/20" />
            </div>
          )}
          <div className="flex items-center gap-2 text-fuchsia-300">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm font-medium">AI認識中...</span>
          </div>
          <p className="text-center text-xs text-white/35">ジャケット画像からアーティスト・タイトル・フォーマットを解析しています</p>
        </div>
      )}

      {step === 'review' && (
        <div>
          <Card className="mb-4 flex items-center gap-2 border-fuchsia-400/25 bg-fuchsia-500/[0.06]">
            <Sparkles className="size-4 text-fuchsia-400" />
            <p className="text-xs text-fuchsia-200">AIが内容を自動入力しました。内容を確認・編集して確定してください。</p>
          </Card>

          <div className="mb-4 flex items-center gap-3">
            <RecordCover color={form.color} artist={form.artist} title={form.title} format={form.format} />
            <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
              <RotateCcw className="size-3.5" />
              撮り直す
            </button>
          </div>

          <div className="space-y-3">
            <Field label="アーティスト">
              <input
                value={form.artist}
                onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="タイトル">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="フォーマット">
                <select
                  value={form.format}
                  onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as Format }))}
                  className="input"
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ジャンル">
                <select
                  value={form.genre}
                  onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value as Genre }))}
                  className="input"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="レーベル">
                <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="input" />
              </Field>
              <Field label="発売年">
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                  className="input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="購入価格（任意）">
                <input
                  type="number"
                  placeholder="¥"
                  value={form.price ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="input"
                />
              </Field>
              <Field label="購入店舗（任意）">
                <input
                  value={form.store ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
                  className="input"
                />
              </Field>
            </div>
            <Field label="メモ（任意）">
              <textarea
                value={form.notes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="input resize-none"
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={confirm}
            disabled={!form.artist || !form.title}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/40 disabled:opacity-40"
          >
            <Check className="size-4" />
            コレクションに追加する
          </button>
        </div>
      )}
    </Screen>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-white/40">{label}</span>
      {children}
    </label>
  )
}
