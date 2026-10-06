const DEEZER_API = 'https://api.deezer.com'
const REQUEST_TIMEOUT_MS = 5000
const MAX_CANDIDATES = 5

interface DeezerSearchTrack {
  id: number
  title: string
  artist?: { name?: string }
}

interface DeezerTrack extends DeezerSearchTrack {
  bpm?: number
}

async function deezerGet<T>(path: string): Promise<T> {
  const res = await fetch(`${DEEZER_API}${path}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Deezer API responded ${res.status}`)
  const body = (await res.json()) as T & { error?: unknown }
  if (body.error) throw new Error(`Deezer API error: ${JSON.stringify(body.error)}`)
  return body
}

function normalize(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function matches(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/**
 * Looks up a track's BPM on Deezer. The search endpoint does not return `bpm`,
 * so each candidate is fetched individually. Returns null when no candidate
 * matches the artist and title, or when Deezer has no BPM (reported as 0).
 */
export async function lookupDeezerBpm(artist: string, title: string): Promise<number | null> {
  // The advanced `artist:"" track:""` syntax returned no results in testing, so use a plain query
  // and filter candidates by artist/title ourselves.
  const query = `${artist} ${title}`
  const search = await deezerGet<{ data?: DeezerSearchTrack[] }>(
    `/search?q=${encodeURIComponent(query)}&limit=${MAX_CANDIDATES}`,
  )

  const candidates = (search.data ?? []).filter(
    (t) => matches(t.title, title) && matches(t.artist?.name ?? '', artist),
  )

  for (const candidate of candidates) {
    const track = await deezerGet<DeezerTrack>(`/track/${candidate.id}`)
    if (track.bpm && track.bpm > 0) return Math.round(track.bpm)
  }
  return null
}
