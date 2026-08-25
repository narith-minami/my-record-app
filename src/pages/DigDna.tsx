import { Music2 } from 'lucide-react'
import { GenreRadar } from '../components/charts'
import { Screen } from '../components/Screen'
import { Card, Pill, SectionTitle } from '../components/ui'
import { useApp } from '../context/AppContext'
import { formatBreakdown, genreBreakdown, topArtists, topLabels, yearStats } from '../lib/analytics'
import type { DnaMode } from '../types'

const MODES: { label: string; value: DnaMode }[] = [
  { label: 'コレクションのみ', value: 'collection' },
  { label: 'Spotifyのみ', value: 'spotify' },
  { label: '統合', value: 'integrated' },
]

export function DigDna() {
  const { collection, dnaMode, setDnaMode, profile } = useApp()
  const dna = genreBreakdown(collection)
  const artists = topArtists(collection)
  const labels = topLabels(collection)
  const years = yearStats(collection)
  const formats = formatBreakdown(collection)

  const spotifyLocked = dnaMode !== 'collection' && !profile.spotifyConnected

  return (
    <Screen title="DIG DNA" subtitle="あなたの音楽趣味の傾向" back>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {MODES.map((m) => (
          <Pill key={m.value} active={dnaMode === m.value} onClick={() => setDnaMode(m.value)}>
            {m.label}
          </Pill>
        ))}
      </div>

      {spotifyLocked ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Music2 className="size-8 text-white/25" />
          <p className="text-sm font-medium text-white/70">Spotifyと連携されていません</p>
          <p className="text-xs text-white/40">プロフィール画面からSpotifyを連携すると、再生履歴も分析対象に含められます</p>
        </Card>
      ) : (
        <>
          <Card>
            <GenreRadar data={dna} />
          </Card>

          <Card className="mt-3">
            <SectionTitle>ジャンル内訳</SectionTitle>
            <ul className="space-y-2">
              {dna
                .filter((d) => d.count > 0)
                .sort((a, b) => b.percent - a.percent)
                .map((d) => (
                  <li key={d.genre} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{d.genre}</span>
                    <span className="font-semibold text-white/90">
                      {d.percent}%<span className="ml-1.5 text-xs font-normal text-white/35">({d.count}枚)</span>
                    </span>
                  </li>
                ))}
            </ul>
          </Card>

          {years && (
            <Card className="mt-3">
              <SectionTitle>年代の傾向</SectionTitle>
              <p className="text-2xl font-semibold tracking-tight">
                {years.min}〜{years.max}
                <span className="ml-2 text-sm font-normal text-white/40">が中心</span>
              </p>
              <p className="mt-1 text-xs text-white/45">
                もっとも多い年: {years.mostCommonYear}（{years.mostCommonCount}枚）
              </p>
            </Card>
          )}

          <Card className="mt-3">
            <SectionTitle>フォーマット内訳</SectionTitle>
            <div className="flex gap-4">
              {formats.map((f) => (
                <div key={f.format} className="flex-1 rounded-xl bg-white/[0.03] py-3 text-center">
                  <p className="text-lg font-semibold">{f.count}</p>
                  <p className="text-[11px] text-white/40">{f.format}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-3">
            <SectionTitle>よく持っているアーティスト</SectionTitle>
            <p className="text-sm text-white/75">{artists.map((a) => a.name).join(' / ') || '—'}</p>
          </Card>

          <Card className="mt-3">
            <SectionTitle>よく持っているレーベル</SectionTitle>
            <p className="text-sm text-white/75">{labels.map((l) => l.name).join(' / ') || '—'}</p>
          </Card>

          {dnaMode !== 'collection' && (
            <Card className="mt-3 border-emerald-400/20 bg-emerald-500/[0.05]">
              <p className="text-xs text-emerald-300">
                Spotifyの再生履歴を統合中：コレクションに無い曲の傾向も分析に反映されています（デモデータ）
              </p>
            </Card>
          )}
        </>
      )}
    </Screen>
  )
}
