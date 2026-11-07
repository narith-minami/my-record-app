import { ArrowLeft, Camera, ExternalLink, History, Loader2, Music2, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui'
import { useApp } from '../context/AppContext'
import { GUIDE_RATIO, getGuideRect, useAutoCapture } from '../lib/useAutoCapture'

interface QuickResult {
  recognized: boolean
  printedText: string
  artist: string
  title: string
  confidence: 'high' | 'medium' | 'low'
}

interface IdentifySource {
  title: string
  url: string
}

interface EnrichResult {
  artist: string
  title: string
  verified: boolean
  corrected: boolean
  releaseYear: string
  label: string
  genre: string
  producer: string
  bpm: string
  bpmSource: 'deezer' | 'search' | null
  artistInfo: string
  notes: string
  sources: IdentifySource[]
}

interface ScanErrorInfo {
  message: string
  detail: string
}

/** Collects status / server stage+detail / network exception into a copyable debug string. */
async function describeFailure(res: Response | null, err: unknown): Promise<string> {
  const lines: string[] = [`time: ${new Date().toISOString()}`]
  if (res) {
    lines.push(`HTTP ${res.status} ${res.statusText}`.trim())
    try {
      const body = (await res.clone().json()) as { error?: string; stage?: string; detail?: string }
      if (body.stage) lines.push(`stage: ${body.stage}`)
      if (body.error) lines.push(`error: ${body.error}`)
      if (body.detail) lines.push(`detail: ${body.detail}`)
    } catch {
      const text = await res.text().catch(() => '')
      if (text) lines.push(`body: ${text.slice(0, 300)}`)
    }
  } else if (err instanceof Error) {
    lines.push(`${err.name}: ${err.message}`)
  } else if (err !== undefined) {
    lines.push(String(err))
  }
  return lines.join('\n')
}

class HttpError extends Error {
  readonly res: Response
  constructor(res: Response) {
    super(`HTTP ${res.status}`)
    this.res = res
  }
}

async function failureDetail(err: unknown): Promise<string> {
  return err instanceof HttpError ? describeFailure(err.res, undefined) : describeFailure(null, err)
}

function ErrorDetails({ detail }: { detail: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <details className="mt-2 pointer-events-auto text-left">
      <summary className="cursor-pointer text-xs text-white/70">詳細を表示</summary>
      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/40 p-2 text-[10px] leading-snug text-white/80">
        {detail}
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard
            ?.writeText(detail)
            .then(() => setCopied(true))
            .catch(() => {})
        }}
        className="mt-1 rounded-md border border-white/20 px-2 py-0.5 text-[10px] text-white/70"
      >
        {copied ? 'コピーしました' : 'コピー'}
      </button>
    </details>
  )
}

const MAX_DIMENSION = 1024
const THUMBNAIL_DIMENSION = 160

export function JacketScan() {
  const { addScanHistoryEntry } = useApp()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null)
  const thumbnailRef = useRef<string | null>(null)
  const scanIdRef = useRef(0)
  const [previous, setPrevious] = useState<{ artist: string; title: string } | null>(null)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<ScanErrorInfo | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [quick, setQuick] = useState<QuickResult | null>(null)
  const [detail, setDetail] = useState<EnrichResult | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(false)

  const sheetOpen = quick !== null

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch((err: DOMException) => {
        if (cancelled) return
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'カメラへのアクセスを許可してください'
            : 'カメラが見つかりませんでした',
        )
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const thumbnailCanvas = thumbnailCanvasRef.current
    const rect = video && getGuideRect(video)
    if (!video || !canvas || !thumbnailCanvas || !rect) return

    // crop to the guide square: fewer pixels to upload and less background noise for the model
    const size = Math.round(Math.min(MAX_DIMENSION, rect.side))
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, rect.sx, rect.sy, rect.side, rect.side, 0, 0, size, size)

    const thumbSize = Math.round(Math.min(THUMBNAIL_DIMENSION, rect.side))
    thumbnailCanvas.width = thumbSize
    thumbnailCanvas.height = thumbSize
    const thumbCtx = thumbnailCanvas.getContext('2d')
    if (thumbCtx) {
      thumbCtx.drawImage(video, rect.sx, rect.sy, rect.side, rect.side, 0, 0, thumbSize, thumbSize)
      thumbnailRef.current = thumbnailCanvas.toDataURL('image/jpeg', 0.7)
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPhotoUrl(dataUrl)
    setAnalyzing(true)
    void identify(dataUrl.split(',')[1])
  }, [])

  const progress = useAutoCapture({
    videoRef,
    enabled: !cameraError && !analyzing && !sheetOpen,
    onTrigger: capture,
  })

  async function identify(base64: string) {
    const scanId = ++scanIdRef.current
    setScanError(null)
    try {
      const res = await fetch('/api/identify-jacket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
      })
      if (!res.ok) throw new HttpError(res)
      const data = (await res.json()) as QuickResult
      if (scanId !== scanIdRef.current) return
      setAnalyzing(false)

      if (!data.recognized) {
        setScanError({
          message: '認識できませんでした。ジャケットを少し動かして、もう一度かざしてください。',
          detail: '',
        })
        return
      }

      setQuick(data)
      // run the slow lookups in parallel; the artist/title card is already visible
      void searchYoutube(scanId, data.artist, data.title)
      void enrich(scanId, data, base64)
    } catch (err) {
      const detail = await failureDetail(err)
      if (scanId !== scanIdRef.current) return
      setAnalyzing(false)
      setScanError({ message: '解析に失敗しました。もう一度お試しください。', detail })
    }
  }

  async function enrich(scanId: number, base: QuickResult, base64: string) {
    setDetail(null)
    setPrevious(null)
    setDetailError(null)
    setDetailLoading(true)
    let data: EnrichResult | null = null
    let errorDetail: string | null = null
    try {
      const res = await fetch('/api/enrich-jacket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: 'image/jpeg',
          artist: base.artist,
          title: base.title,
          printedText: base.printedText,
        }),
      })
      if (!res.ok) throw new HttpError(res)
      data = (await res.json()) as EnrichResult
    } catch (err) {
      data = null
      errorDetail = await failureDetail(err)
    }
    if (scanId !== scanIdRef.current) return
    setDetail(data)
    setDetailError(errorDetail)
    setDetailLoading(false)

    const finalArtist = data?.artist || base.artist
    const finalTitle = data?.title || base.title
    if (data?.corrected) {
      // verification found a different record: swap it in and re-run the YouTube lookup
      setPrevious({ artist: base.artist, title: base.title })
      setQuick({ ...base, artist: finalArtist, title: finalTitle })
      void searchYoutube(scanId, finalArtist, finalTitle)
    }
    addScanHistoryEntry({
      artist: finalArtist,
      title: finalTitle,
      bpm: data?.bpm ?? '不明',
      releaseYear: data?.releaseYear ?? '不明',
      genre: data?.genre ?? '不明',
      confidence: base.confidence,
      thumbnail: thumbnailRef.current ?? undefined,
    })
  }

  async function searchYoutube(scanId: number, artist: string, title: string) {
    setYoutubeLoading(true)
    setYoutubeVideoId(null)
    let videoId: string | null = null
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(`${artist} ${title}`)}`)
      if (!res.ok) throw new Error(`request failed: ${res.status}`)
      videoId = ((await res.json()) as { videoId: string | null }).videoId
    } catch {
      videoId = null
    }
    if (scanId !== scanIdRef.current) return
    setYoutubeVideoId(videoId)
    setYoutubeLoading(false)
  }

  /** Dismiss the result sheet and go back to watching for the next jacket. */
  function scanNext() {
    scanIdRef.current++
    setQuick(null)
    setDetail(null)
    setDetailLoading(false)
    setDetailError(null)
    setPrevious(null)
    setPhotoUrl(null)
    setScanError(null)
    setYoutubeVideoId(null)
    setYoutubeLoading(false)
  }

  const query = quick ? encodeURIComponent(`${quick.artist} ${quick.title}`) : ''
  const guideState = analyzing ? 'analyzing' : progress > 0 ? 'holding' : 'searching'

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={thumbnailCanvasRef} className="hidden" />

      {/* scan guide */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div
          style={{ width: `${GUIDE_RATIO * 100}%` }}
          className={`relative aspect-square rounded-2xl border-2 transition-colors ${
            guideState === 'searching'
              ? 'border-dashed border-fuchsia-400/70'
              : 'border-solid border-fuchsia-300 shadow-[0_0_24px_rgba(232,121,249,0.45)]'
          } ${guideState === 'analyzing' ? 'animate-pulse' : ''}`}
        >
          {guideState === 'holding' && (
            <div
              className="absolute -bottom-1 left-0 h-1 rounded-full bg-fuchsia-300"
              style={{ width: `${progress * 100}%` }}
            />
          )}
        </div>
        {!sheetOpen && (
          <p className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/80">
            {guideState === 'analyzing'
              ? '解析中...'
              : guideState === 'holding'
                ? 'そのまま固定してください'
                : 'ジャケットを枠に合わせてかざしてください'}
          </p>
        )}
      </div>

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="戻る"
          className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Link
          to="/scan-history"
          aria-label="スキャン履歴"
          className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <History className="size-5" />
        </Link>
      </div>

      {(cameraError || scanError) && !sheetOpen && (
        <div className="pointer-events-auto absolute inset-x-4 top-16 rounded-xl border border-red-400/30 bg-red-500/30 px-4 py-3 text-center text-sm text-red-50 backdrop-blur">
          {cameraError ?? scanError?.message}
          {!cameraError && scanError?.detail && <ErrorDetails detail={scanError.detail} />}
        </div>
      )}

      {/* manual shutter (fallback) */}
      {!sheetOpen && (
        <div className="absolute inset-x-0 bottom-10 flex justify-center">
          <button
            type="button"
            onClick={capture}
            disabled={!!cameraError || analyzing}
            aria-label="撮影"
            className="flex size-16 items-center justify-center rounded-full border-4 border-white/80 bg-white/20 disabled:opacity-30"
          >
            {analyzing ? <Loader2 className="size-6 animate-spin text-white" /> : <Camera className="size-6 text-white" />}
          </button>
        </div>
      )}

      {/* full-screen result: fixed header (title + video), scrolling details, fixed footer */}
      {quick && (
        <div className="fixed inset-0 z-10 flex h-dvh flex-col bg-[#0e0b1a]">
          <header className="shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={scanNext}
                aria-label="カメラに戻る"
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <ArrowLeft className="size-5" />
              </button>
              <Link
                to="/scan-history"
                aria-label="スキャン履歴"
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <History className="size-5" />
              </Link>
            </div>

            <div className="mb-2 flex items-center gap-3">
              {photoUrl && <img src={photoUrl} alt="captured jacket" className="size-14 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-white">{quick.artist}</p>
                <p className="truncate text-sm text-white/60">{quick.title}</p>
              </div>
            </div>

            <div className="mb-2 text-xs">
              {detailLoading ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">候補・Web検索で確認中</span>
              ) : detail?.verified ? (
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-green-300">
                  {detail.corrected ? '検索で訂正・確認済み' : '確認済み'}
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">未確認（候補）</span>
              )}
              {previous && (
                <span className="ml-2 text-white/40">
                  読み取り候補: {previous.artist} / {previous.title}
                </span>
              )}
              {!detailLoading && !detail?.verified && (
                <p className="mt-1 text-white/50">違う場合は、文字がはっきり見えるようにもう一度撮影してください。</p>
              )}
            </div>

            {/* video slot keeps the same height in every state so the layout never jumps */}
            <div className="aspect-video max-h-[30dvh] w-full overflow-hidden rounded-xl bg-black">
              {youtubeLoading ? (
                <div className="flex size-full items-center justify-center gap-2 text-xs text-white/40">
                  <Loader2 className="size-3.5 animate-spin" />
                  YouTubeを検索中...
                </div>
              ) : youtubeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                  title="YouTube video player"
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-white/40">
                  動画が見つかりませんでした
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
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
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
            {detailLoading && (
              <div className="mb-3 flex items-center gap-2 text-xs text-fuchsia-300">
                <Loader2 className="size-3.5 animate-spin" />
                Web検索で確認・詳細を取得中...
              </div>
            )}

            {detail && (
              <>
                <Card className="mb-3">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <MetaField label="発売年" value={detail.releaseYear} />
                    <MetaField label="レーベル" value={detail.label} />
                    <MetaField label="ジャンル" value={detail.genre} />
                    <MetaField label="プロデューサー" value={detail.producer} />
                    <MetaField
                      label="BPM"
                      value={detail.bpmSource === 'search' ? `${detail.bpm}（検索による推定）` : detail.bpm}
                    />
                  </dl>
                </Card>

                {detail.artistInfo && (
                  <Card className="mb-3">
                    <p className="mb-1 text-[11px] font-medium text-white/40">アーティスト情報</p>
                    <p className="text-sm leading-relaxed text-white/75">{detail.artistInfo}</p>
                  </Card>
                )}

                {detail.notes && (
                  <Card className="mb-3">
                    <p className="mb-1 text-[11px] font-medium text-white/40">補足</p>
                    <p className="text-xs text-white/45">{detail.notes}</p>
                  </Card>
                )}

                {detail.sources.length > 0 && (
                  <Card className="mb-3">
                    <p className="mb-1.5 text-[11px] font-medium text-white/40">Web検索で確認</p>
                    <ul className="space-y-1">
                      {detail.sources.map((s) => (
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
              </>
            )}

            {!detailLoading && !detail && (
              <div className="mb-3 text-xs text-white/40">
                詳細情報を取得できませんでした。
                {detailError && <ErrorDetails detail={detailError} />}
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-white/10 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={scanNext}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 py-3 text-center text-xs text-white/70 hover:bg-white/[0.04]"
            >
              <RotateCcw className="size-3.5" />
              次のジャケットをスキャン
            </button>
          </footer>
        </div>
      )}
    </div>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-white/40">{label}</dt>
      <dd className="mt-0.5 text-white/85">{value || '不明'}</dd>
    </div>
  )
}
