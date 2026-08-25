import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RecordCover } from '../components/RecordCover'
import { Screen } from '../components/Screen'
import { EmptyState, Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import type { Format } from '../types'

const FILTERS: { label: string; value: Format | 'ALL' }[] = [
  { label: 'ALL', value: 'ALL' },
  { label: 'LP', value: 'LP' },
  { label: '12"', value: '12"' },
  { label: '7"', value: '7"' },
]

export function Collection() {
  const { collection } = useApp()
  const [filter, setFilter] = useState<Format | 'ALL'>('ALL')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return collection.filter((r) => {
      if (filter !== 'ALL' && r.format !== filter) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return r.artist.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)
    })
  }, [collection, filter, query])

  return (
    <Screen
      title="Collection"
      subtitle={`全 ${collection.length} 枚`}
      right={
        <Link
          to="/collection/add"
          className="flex size-9 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/40"
          aria-label="レコードを追加"
        >
          <Plus className="size-5" />
        </Link>
      }
    >
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <Search className="size-4 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="アーティスト・タイトルで検索"
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Pill key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Pill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="該当するレコードがありません" hint="検索条件を変えてみてください" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((r) => (
            <Link key={r.id} to={`/collection/${r.id}`} className="group">
              <RecordCover color={r.color} artist={r.artist} title={r.title} format={r.format} size="lg" />
              <p className="mt-1.5 truncate text-xs font-medium text-white/85">{r.artist}</p>
              <p className="truncate text-[11px] text-white/45">{r.title}</p>
            </Link>
          ))}
        </div>
      )}
    </Screen>
  )
}
