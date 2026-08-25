import { Heart, Music2 } from 'lucide-react'
import { useState } from 'react'
import { RecordCover } from '../components/RecordCover'
import { Screen } from '../components/Screen'
import { Card, EmptyState, Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import type { DnaMode } from '../types'

const MODES: { label: string; value: DnaMode }[] = [
  { label: 'コレクションのみ', value: 'collection' },
  { label: 'Spotifyのみ', value: 'spotify' },
  { label: '統合', value: 'integrated' },
]

export function Discover() {
  const { recommendations, dnaMode, setDnaMode, profile, toggleSpotify, addWant, wantlist } = useApp()
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const wantKeys = new Set(wantlist.map((w) => `${w.artist}__${w.title}`))

  return (
    <Screen title="おすすめ" subtitle="Based on your DIG DNA" back>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {MODES.map((m) => (
          <Pill key={m.value} active={dnaMode === m.value} onClick={() => setDnaMode(m.value)}>
            {m.label}
          </Pill>
        ))}
      </div>

      {dnaMode !== 'collection' && !profile.spotifyConnected ? (
        <EmptyState
          icon={<Music2 className="size-8 text-white/25" />}
          title="Spotifyと連携するとおすすめが強化されます"
          hint="再生履歴の傾向も一致度スコアに反映されます"
        />
      ) : recommendations.length === 0 ? (
        <EmptyState title="おすすめがまだありません" />
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const already = addedIds.has(rec.id) || wantKeys.has(`${rec.artist}__${rec.title}`)
            return (
              <Card key={rec.id}>
                <div className="flex gap-3">
                  <RecordCover color={rec.color} artist={rec.artist} title={rec.title} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{rec.artist}</p>
                        <p className="truncate text-xs text-white/55">{rec.title}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-2 py-1 text-[11px] font-bold text-fuchsia-300">
                        Match {rec.matchScore}%
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {rec.reasons.map((r) => (
                        <li key={r} className="flex items-start gap-1.5 text-[11px] text-white/45">
                          <span className="mt-1 size-1 shrink-0 rounded-full bg-fuchsia-400/70" />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => {
                        addWant({ artist: rec.artist, title: rec.title, format: '12"', color: rec.color })
                        setAddedIds((prev) => new Set(prev).add(rec.id))
                      }}
                      className="mt-3 flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 disabled:border-emerald-400/30 disabled:text-emerald-300"
                    >
                      <Heart className="size-3.5" fill={already ? 'currentColor' : 'none'} />
                      {already ? 'Wantに追加済み' : 'Wantに追加'}
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {!profile.spotifyConnected && (
        <button
          type="button"
          onClick={toggleSpotify}
          className="mt-4 w-full rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] py-3 text-center text-xs font-medium text-emerald-300"
        >
          Spotifyと連携する（デモ）
        </button>
      )}
    </Screen>
  )
}
