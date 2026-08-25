import { MapPin, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RecordCover } from '../components/RecordCover'
import { Screen } from '../components/Screen'
import { Card, EmptyState } from '../components/ui'
import { useApp } from '../context/AppContext'
import { relativeDate, yen } from '../lib/format'

export function MyDigLog() {
  const { digLog } = useApp()

  const weeklyDigs = useMemo(() => {
    const now = new Date()
    return digLog.filter((l) => (now.getTime() - new Date(`${l.date}T00:00:00`).getTime()) / 86_400_000 <= 7).length
  }, [digLog])

  const storeCount = useMemo(() => new Set(digLog.map((l) => l.store)).size, [digLog])

  return (
    <Screen
      title="My DIG Log"
      subtitle="どこで・何を見つけたか、自分だけの記録"
      right={
        <Link
          to="/log/new"
          className="flex size-9 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/40"
          aria-label="発見を記録"
        >
          <Plus className="size-5" />
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-semibold text-fuchsia-300">{weeklyDigs}</p>
          <p className="mt-0.5 text-[11px] text-white/40">Weekly Digs（今週の発見）</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-semibold">{storeCount}</p>
          <p className="mt-0.5 text-[11px] text-white/40">訪問店舗数</p>
        </Card>
      </div>

      {digLog.length === 0 ? (
        <EmptyState icon={<MapPin className="size-8 text-white/25" />} title="まだ発見の記録がありません" hint="DIG INで最初の発見を記録しよう" />
      ) : (
        <div className="space-y-3">
          {digLog.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-center gap-3">
                <RecordCover color={entry.color} artist={entry.artist} title={entry.title} format={entry.format} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[11px] text-white/40">
                    <MapPin className="size-3" />
                    {relativeDate(entry.date)}・{entry.area}・{entry.store}
                  </p>
                  <p className="truncate text-sm font-semibold">{entry.artist}</p>
                  <p className="truncate text-xs text-white/55">{entry.title}</p>
                  {entry.note && <p className="mt-1 truncate text-[11px] text-white/35">{entry.note}</p>}
                </div>
                {entry.price != null && <span className="shrink-0 text-xs font-semibold text-white/70">{yen(entry.price)}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  )
}
