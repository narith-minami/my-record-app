import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** How long to wait after starting before judging the video as black / stalled. */
const HEALTH_CHECK_MS = 1500

export interface CameraState {
  /** Frames are actually rendering (videoWidth > 0 and playing). */
  ready: boolean
  /** getUserMedia failed (permission denied / no camera). */
  error: string | null
  /** Autoplay was blocked: the user must tap to start playback. */
  needsTap: boolean
  /** Set when the stream is up but nothing renders (black screen): debug info for the user. */
  stalledDetail: string | null
  /** Re-acquire the camera from scratch. */
  restart: () => void
  /** Make sure the camera is running (re-acquire if dead, otherwise play()). */
  resume: () => void
  /** Start playback from a user gesture. */
  tapToStart: () => void
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

function hasLiveTrack(stream: MediaStream | null): boolean {
  return !!stream && stream.getVideoTracks().some((t) => t.readyState === 'live')
}

async function openStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') throw err
    // some devices reject the preferred constraints: fall back to any camera
    return navigator.mediaDevices.getUserMedia({ video: true })
  }
}

function snapshot(video: HTMLVideoElement, stream: MediaStream): string {
  const track = stream.getVideoTracks()[0]
  const settings = track?.getSettings?.() ?? {}
  return [
    `time: ${new Date().toISOString()}`,
    `video: readyState=${video.readyState} paused=${video.paused} size=${video.videoWidth}x${video.videoHeight}`,
    `track: ${track ? `${track.readyState} muted=${track.muted} enabled=${track.enabled}` : 'none'}`,
    `label: ${track?.label ?? ''}`,
    `settings: ${JSON.stringify(settings)}`,
    `ua: ${navigator.userAgent}`,
  ].join('\n')
}

/** Opens the rear camera into `videoRef`, and recovers when the picture stays black. */
export function useCamera(videoRef: RefObject<HTMLVideoElement | null>): CameraState {
  const streamRef = useRef<MediaStream | null>(null)
  const generationRef = useRef(0)
  const startRef = useRef<(isRetry?: boolean) => Promise<void>>(async () => {})
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsTap, setNeedsTap] = useState(false)
  const [stalledDetail, setStalledDetail] = useState<string | null>(null)

  const start = useCallback(
    async (isRetry = false) => {
      const gen = ++generationRef.current
      const stale = () => gen !== generationRef.current

      stopStream(streamRef.current)
      streamRef.current = null
      setReady(false)
      setError(null)
      setNeedsTap(false)
      setStalledDetail(null)

      let stream: MediaStream
      try {
        stream = await openStream()
      } catch (err) {
        if (stale()) return
        setError(
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'カメラへのアクセスを許可してください'
            : 'カメラが見つかりませんでした',
        )
        return
      }
      if (stale()) {
        stopStream(stream)
        return
      }
      streamRef.current = stream

      const video = videoRef.current
      if (!video) return

      // iOS Safari needs these as real attributes; React does not always render `muted`
      video.muted = true
      video.playsInline = true
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      video.srcObject = stream

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (stale()) return
          setReady(false)
          setTimeout(() => {
            if (!stale()) void startRef.current()
          }, 500)
        }
      })

      video.play().catch((err: DOMException) => {
        if (stale()) return
        if (err.name === 'NotAllowedError') setNeedsTap(true)
      })

      setTimeout(() => {
        if (stale() || !videoRef.current) return
        const v = videoRef.current
        if (v.videoWidth > 0 && !v.paused && v.readyState >= 2) {
          setReady(true)
          return
        }
        if (!isRetry) {
          void startRef.current(true)
          return
        }
        // still not playing after a retry: a user gesture is probably required (iOS), else it is stalled
        if (v.paused) {
          setNeedsTap(true)
          return
        }
        setStalledDetail(snapshot(v, stream))
      }, HEALTH_CHECK_MS)
    },
    [videoRef],
  )

  useEffect(() => {
    startRef.current = start
  }, [start])

  // flip to ready as soon as frames really render (covers slow starts after the health check)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlaying = () => {
      // `resize` also fires for a paused (autoplay-blocked) video, so require real playback
      if (video.videoWidth > 0 && !video.paused) {
        setReady(true)
        setNeedsTap(false)
        setStalledDetail(null)
      }
    }
    video.addEventListener('playing', onPlaying)
    video.addEventListener('resize', onPlaying)
    return () => {
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('resize', onPlaying)
    }
  }, [videoRef])

  useEffect(() => {
    void start()
    return () => {
      generationRef.current++
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [start])

  const resume = useCallback(() => {
    if (!hasLiveTrack(streamRef.current)) {
      void startRef.current()
      return
    }
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {})
    setTimeout(() => {
      const v = videoRef.current
      if (v && (v.videoWidth === 0 || v.paused)) void startRef.current(true)
    }, 800)
  }, [videoRef])

  // coming back to the tab (or from the YouTube audio session) can leave the video frozen
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') resume()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onVisible)
    }
  }, [resume])

  const tapToStart = useCallback(() => {
    videoRef.current?.play().catch(() => {})
  }, [videoRef])

  const restart = useCallback(() => void startRef.current(), [])

  return { ready, error, needsTap, stalledDetail, restart, resume, tapToStart }
}
