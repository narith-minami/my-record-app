import { History, Music2 } from 'lucide-react'
import { Screen } from '../components/Screen'
import { Card, EmptyState } from '../components/ui'
import { useApp } from '../context/AppContext'
import { relativeDate } from '../lib/format'

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export function ScanHistory() {
  const { scanHistory } = useApp()

  return (
    <Screen title="スキャン履歴" subtitle="ジャケットスキャンで認識したレコード">
      {scanHistory.length === 0 ? (
        <EmptyState
          icon={<History className="size-8 text-white/25" />}
          title="まだスキャン履歴がありません"
          hint="ジャケットをスキャンすると、ここに一覧が表示されます"
        />
      ) : (
        <div className="space-y-3">
          {scanHistory.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-center gap-3">
                {entry.thumbnail ? (
                  <img src={entry.thumbnail} alt={`${entry.artist} - ${entry.title}`} className="size-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Music2 className="size-6 text-white/25" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-white/40">{relativeDate(entry.scannedAt.slice(0, 10))}</p>
                  <p className="truncate text-sm font-semibold">{entry.artist}</p>
                  <p className="truncate text-xs text-white/55">{entry.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">
                      BPM {entry.bpm}
                    </span>
                    {entry.releaseYear && entry.releaseYear !== '不明' && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50">
                        {entry.releaseYear}
                      </span>
                    )}
                    {entry.genre && entry.genre !== '不明' && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50">
                        {entry.genre}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-white/30">確信度{CONFIDENCE_LABEL[entry.confidence]}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  )
}
