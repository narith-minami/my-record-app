import { ExternalLink, Loader2, Music2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { Card } from '../components/ui'
import { useApp } from '../context/AppContext'

const CONFIDENCE_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' }

export function ScanHistoryDetail() {
  const { id } = useParams()
  const { scanHistory } = useApp()
  const entry = scanHistory.find((e) => e.id === id)

  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(true)
  const artist = entry?.artist
  const title = entry?.title

  useEffect(() => {
    if (!artist || !title) return
    let cancelled = false
    setVideoLoading(true)
    fetch(`/api/youtube-search?q=${encodeURIComponent(`${artist} ${title}`)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`request failed: ${res.status}`)
        return res.json() as Promise<{ videoId: string | null }>
      })
      .then((data) => !cancelled && setVideoId(data.videoId))
      .catch(() => !cancelled && setVideoId(null))
      .finally(() => !cancelled && setVideoLoading(false))
    return () => {
      cancelled = true
    }
  }, [artist, title])

  if (!entry) return <Navigate to="/scan-history" replace />

  const query = encodeURIComponent(`${entry.artist} ${entry.title}`)
  const bpm = entry.bpmSource === 'search' ? `${entry.bpm}（検索による推定）` : entry.bpm

  return (
    <Screen title={entry.artist} subtitle={entry.title} back>
      <div className="mb-4 flex items-center gap-3">
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt={`${entry.artist} - ${entry.title}`} className="size-24 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-white/5">
            <Music2 className="size-8 text-white/25" />
          </div>
        )}
        <div className="min-w-0 text-xs text-white/50">
          <p>{new Date(entry.scannedAt).toLocaleString('ja-JP')}</p>
          <p className="mt-1">確信度 {CONFIDENCE_LABEL[entry.confidence]}</p>
          <p className="mt-1">{entry.verified ? '確認済み' : '未確認（候補）'}</p>
        </div>
      </div>

      <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl bg-black">
        {videoLoading ? (
          <div className="flex size-full items-center justify-center gap-2 text-xs text-white/40">
            <Loader2 className="size-3.5 animate-spin" />
            YouTubeを検索中...
          </div>
        ) : videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-white/40">動画が見つかりませんでした</div>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <a
          href={`https://open.spotify.com/search/${query}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2 text-xs font-semibold text-white"
        >
          <Music2 className="size-4" />
          Spotifyで検索
        </a>
        <a
          href={`https://www.youtube.com/results?search_query=${query}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2 text-xs font-semibold text-white"
        >
          <ExternalLink className="size-4" />
          YouTubeで検索
        </a>
      </div>

      <Card className="mb-3">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
          <Field label="発売年" value={entry.releaseYear} />
          <Field label="レーベル" value={entry.label} />
          <Field label="ジャンル" value={entry.genre} />
          <Field label="プロデューサー" value={entry.producer} />
          <Field label="BPM" value={bpm} />
        </dl>
      </Card>

      {entry.artistInfo && (
        <Card className="mb-3">
          <p className="mb-1 text-[11px] font-medium text-white/40">アーティスト情報</p>
          <p className="text-sm leading-relaxed text-white/75">{entry.artistInfo}</p>
        </Card>
      )}

      {entry.notes && (
        <Card className="mb-3">
          <p className="mb-1 text-[11px] font-medium text-white/40">補足</p>
          <p className="text-xs text-white/45">{entry.notes}</p>
        </Card>
      )}

      {entry.sources && entry.sources.length > 0 && (
        <Card className="mb-3">
          <p className="mb-1.5 text-[11px] font-medium text-white/40">Web検索で確認</p>
          <ul className="space-y-1">
            {entry.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-fuchsia-300/80 hover:text-fuchsia-300 hover:underline"
                >
                  <ExternalLink className="size-3 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Screen>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-white/40">{label}</dt>
      <dd className="mt-0.5 text-white/85">{value || '不明'}</dd>
    </div>
  )
}
