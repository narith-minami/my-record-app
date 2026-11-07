import { useEffect, useRef, useState, type RefObject } from 'react'

/** Fraction of the viewport width taken by the square scan guide (keep in sync with the UI). */
export const GUIDE_RATIO = 0.7

const SAMPLE_INTERVAL_MS = 250
const SAMPLE_SIZE = 64
/** How long the frame must stay steady and sharp before auto-capturing. */
const HOLD_MS = 800
/** Mean abs luminance diff (0-255) between samples below which the frame counts as steady. */
const STABLE_DIFF = 5
/** Laplacian variance below which the frame counts as blurry / out of focus. */
const MIN_SHARPNESS = 40
/** Luminance std-dev below which the frame counts as blank (wall, lens cap, ...). */
const MIN_CONTRAST = 22
/** Mean abs diff vs. the last captured frame needed to treat the scene as changed. */
const SCENE_CHANGE_DIFF = 28
const SCENE_CHANGE_SAMPLES = 2

export interface GuideRect {
  sx: number
  sy: number
  side: number
}

/** The square region of the video frame that sits under the on-screen guide (video is `object-cover`). */
export function getGuideRect(video: HTMLVideoElement): GuideRect | null {
  const { videoWidth: vw, videoHeight: vh, clientWidth: cw, clientHeight: ch } = video
  if (!vw || !vh || !cw || !ch) return null
  const scale = Math.max(cw / vw, ch / vh)
  const side = Math.min(vw, vh, (cw * GUIDE_RATIO) / scale)
  return { sx: (vw - side) / 2, sy: (vh - side) / 2, side }
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>
  enabled: boolean
  onTrigger: () => void
}

/**
 * Watches the camera and fires `onTrigger` once the guide area is held steady, in focus and
 * has content. After a trigger it stays disarmed until the scene changes, so pointing at the
 * same jacket does not scan it repeatedly. Returns hold progress (0..1) for UI feedback.
 */
export function useAutoCapture({ videoRef, enabled, onTrigger }: Options): number {
  const [progress, setProgress] = useState(0)
  const onTriggerRef = useRef(onTrigger)
  const referenceRef = useRef<Uint8Array | null>(null) // luminance of the last captured scene
  const armedRef = useRef(true)

  useEffect(() => {
    onTriggerRef.current = onTrigger
  })

  useEffect(() => {
    if (!enabled) return

    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let prev: Uint8Array | null = null
    let heldMs = 0
    let changedSamples = 0

    const timer = setInterval(() => {
      const video = videoRef.current
      const rect = video && getGuideRect(video)
      if (!video || !rect || video.readyState < 2) return

      ctx.drawImage(video, rect.sx, rect.sy, rect.side, rect.side, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
      const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
      const lum = new Uint8Array(SAMPLE_SIZE * SAMPLE_SIZE)
      for (let i = 0; i < lum.length; i++) {
        lum[i] = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8
      }

      if (!armedRef.current) {
        // wait for the scene to change (jacket removed / swapped) before arming again
        const ref = referenceRef.current
        changedSamples = ref && meanAbsDiff(lum, ref) > SCENE_CHANGE_DIFF ? changedSamples + 1 : 0
        if (changedSamples >= SCENE_CHANGE_SAMPLES) {
          armedRef.current = true
          changedSamples = 0
        }
        prev = lum
        return
      }

      const steady = prev !== null && meanAbsDiff(lum, prev) < STABLE_DIFF
      prev = lum
      const { sharpness, contrast } = analyze(lum)
      const good = steady && sharpness >= MIN_SHARPNESS && contrast >= MIN_CONTRAST

      heldMs = good ? heldMs + SAMPLE_INTERVAL_MS : 0
      setProgress(Math.min(1, heldMs / HOLD_MS))

      if (heldMs >= HOLD_MS) {
        heldMs = 0
        armedRef.current = false
        referenceRef.current = lum
        setProgress(0)
        onTriggerRef.current()
      }
    }, SAMPLE_INTERVAL_MS)

    return () => {
      clearInterval(timer)
      setProgress(0)
    }
  }, [enabled, videoRef])

  return enabled ? progress : 0
}

function meanAbsDiff(a: Uint8Array, b: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i])
  return sum / a.length
}

function analyze(lum: Uint8Array): { sharpness: number; contrast: number } {
  const n = SAMPLE_SIZE
  let mean = 0
  for (let i = 0; i < lum.length; i++) mean += lum[i]
  mean /= lum.length
  let variance = 0
  for (let i = 0; i < lum.length; i++) variance += (lum[i] - mean) ** 2
  const contrast = Math.sqrt(variance / lum.length)

  // variance of the 4-neighbour Laplacian: low when the image is blurry
  let lapSum = 0
  let lapSq = 0
  let count = 0
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const i = y * n + x
      const lap = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - n] - lum[i + n]
      lapSum += lap
      lapSq += lap * lap
      count++
    }
  }
  const lapMean = lapSum / count
  return { sharpness: lapSq / count - lapMean * lapMean, contrast }
}
