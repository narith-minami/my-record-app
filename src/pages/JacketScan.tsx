import { Camera, ExternalLink, Loader2, Music2, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Card } from '../components/ui'
import { Screen } from '../components/Screen'

type Step = 'camera' | 'scanning' | 'result'

interface IdentifySource {
  title: string
  url: string
}

interface IdentifyResult {
  recognized: boolean
  artist: string
  title: string
  confidence: 'high' | 'medium' | 'low'
  releaseYear: string
  label: string
  genre: string
  producer: string
  artistInfo: string
  notes: string
  sources: IdentifySource[]
}

const MAX_DIMENSION = 1024

export function JacketScan() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [step, setStep] = useState<Step>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [result, setResult] = useState<IdentifyResult | null>(null)

  useEffect(() => {
    if (step !== 'camera') return

    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
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
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [step])

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return

    const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight))
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    setPhotoUrl(canvas.toDataURL('image/jpeg', 0.85))
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
    setStep('scanning')
    void identify(base64)
  }

  async function identify(base64: string) {
    setScanError(null)
    try {
      const res = await fetch('/api/identify-jacket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
      })
      if (!res.ok) throw new Error(`request failed: ${res.status}`)
      const data = (await res.json()) as IdentifyResult
      setResult(data)
      setStep('result')
    } catch {
      setScanError('解析に失敗しました。もう一度お試しください。')
      setStep('camera')
    }
  }

  function retry() {
    setResult(null)
    setPhotoUrl(null)
    setCameraError(null)
    setScanError(null)
    setStep('camera')
  }

  const query = result ? encodeURIComponent(`${result.artist} ${result.title}`) : ''

  return (
    <>
      {step === 'camera' && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative size-full">
            <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="aspect-square w-[70%] rounded-2xl border-2 border-dashed border-fuchsia-400/70" />
            </div>

            {cameraError && (
              <div className="absolute inset-x-4 top-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
                {cameraError}
              </div>
            )}
            {scanError && (
              <div className="absolute inset-x-4 top-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
                {scanError}
              </div>
            )}

            <div className="absolute inset-x-0 bottom-10 flex justify-center">
              <button
                type="button"
                onClick={capture}
                disabled={!!cameraError}
                aria-label="撮影"
                className="flex size-16 items-center justify-center rounded-full border-4 border-white/80 bg-white/20 disabled:opacity-30"
              >
                <Camera className="size-6 text-white" />
              </button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {step !== 'camera' && (
        <Screen title="ジャケットをスキャン" back>
          {step === 'scanning' && (
            <div className="flex flex-col items-center gap-4 py-16">
              {photoUrl && <img src={photoUrl} alt="captured jacket" className="size-40 rounded-2xl object-cover opacity-70" />}
              <div className="flex items-center gap-2 text-fuchsia-300">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm font-medium">Web検索で確認中...</span>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div>
              {photoUrl && (
                <img src={photoUrl} alt="captured jacket" className="mx-auto mb-4 size-40 rounded-2xl object-cover" />
              )}

              {result.recognized ? (
                <>
                  <Card className="mb-3 text-center">
                    <p className="text-lg font-semibold text-white">{result.artist}</p>
                    <p className="text-sm text-white/60">{result.title}</p>
                  </Card>

                  <Card className="mb-3">
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                      <MetaField label="発売年" value={result.releaseYear} />
                      <MetaField label="レーベル" value={result.label} />
                      <MetaField label="ジャンル" value={result.genre} />
                      <MetaField label="プロデューサー" value={result.producer} />
                    </dl>
                  </Card>

                  {result.artistInfo && (
                    <Card className="mb-3">
                      <p className="mb-1 text-[11px] font-medium text-white/40">アーティスト情報</p>
                      <p className="text-sm leading-relaxed text-white/75">{result.artistInfo}</p>
                    </Card>
                  )}

                  {result.notes && (
                    <Card className="mb-3">
                      <p className="mb-1 text-[11px] font-medium text-white/40">補足</p>
                      <p className="text-xs text-white/45">{result.notes}</p>
                    </Card>
                  )}

                  {result.sources.length > 0 && (
                    <Card className="mb-4">
                      <p className="mb-1.5 text-[11px] font-medium text-white/40">Web検索で確認</p>
                      <ul className="space-y-1">
                        {result.sources.map((s) => (
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
              ) : (
                <Card className="mb-4 border-amber-400/25 bg-amber-500/[0.06] text-center">
                  <p className="text-sm text-amber-200">認識できませんでした。もう一度お試しください。</p>
                </Card>
              )}

              {result.recognized && (
                <div className="space-y-2">
                  <a
                    href={`https://open.spotify.com/search/${query}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-semibold text-white"
                  >
                    <Music2 className="size-4" />
                    Spotifyで検索
                  </a>
                  <a
                    href={`https://www.youtube.com/results?search_query=${query}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
                  >
                    <ExternalLink className="size-4" />
                    YouTubeで検索
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={retry}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 py-3 text-center text-xs text-white/45 hover:bg-white/[0.04]"
              >
                <RotateCcw className="size-3.5" />
                もう一度撮影する
              </button>
            </div>
          )}
        </Screen>
      )}
    </>
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
