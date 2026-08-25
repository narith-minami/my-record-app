import type { DigLogEntry, Genre, RecordItem } from '../types'

const WEEK_MS = 7 * 86_400_000

function withinLastWeek(dateStr: string, now: number): boolean {
  return now - new Date(`${dateStr}T00:00:00`).getTime() <= WEEK_MS
}

export function weeklyNewArtistCount(records: RecordItem[], now = Date.now()): number {
  const firstSeen = new Map<string, string>()
  for (const r of records) {
    const prev = firstSeen.get(r.artist)
    if (!prev || r.addedAt < prev) firstSeen.set(r.artist, r.addedAt)
  }
  let count = 0
  for (const date of firstSeen.values()) if (withinLastWeek(date, now)) count += 1
  return count
}

export function weeklyStoreCount(digLog: DigLogEntry[], now = Date.now()): number {
  const stores = new Set(digLog.filter((l) => withinLastWeek(l.date, now)).map((l) => l.store))
  return stores.size
}

export function weeklyCheapFindCount(records: RecordItem[], digLog: DigLogEntry[], now = Date.now()): number {
  const cheapRecords = records.filter((r) => withinLastWeek(r.addedAt, now) && (r.price ?? Infinity) <= 1000)
  const cheapLogs = digLog.filter((l) => withinLastWeek(l.date, now) && (l.price ?? Infinity) <= 1000)
  return cheapRecords.length + cheapLogs.length
}

const GENRE_ORDER: Genre[] = ['90s R&B', 'New Jack Swing', 'Hip-Hop', 'Soul/Funk', 'Others']

export interface GenreSlice {
  genre: Genre
  count: number
  percent: number
}

export function genreBreakdown(records: RecordItem[]): GenreSlice[] {
  const total = records.length || 1
  const counts = new Map<Genre, number>()
  for (const g of GENRE_ORDER) counts.set(g, 0)
  for (const r of records) counts.set(r.genre, (counts.get(r.genre) ?? 0) + 1)
  return GENRE_ORDER.map((genre) => ({
    genre,
    count: counts.get(genre) ?? 0,
    percent: Math.round(((counts.get(genre) ?? 0) / total) * 100),
  }))
}

function topBy<T extends string>(records: RecordItem[], pick: (r: RecordItem) => T | undefined, limit: number): { name: T; count: number }[] {
  const counts = new Map<T, number>()
  for (const r of records) {
    const key = pick(r)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

export function topArtists(records: RecordItem[], limit = 3) {
  return topBy(records, (r) => r.artist, limit)
}

export function topLabels(records: RecordItem[], limit = 3) {
  return topBy(records, (r) => r.label, limit)
}

export function yearStats(records: RecordItem[]) {
  const years = records.map((r) => r.year).filter((y): y is number => typeof y === 'number')
  if (years.length === 0) return null
  const min = Math.min(...years)
  const max = Math.max(...years)
  const counts = new Map<number, number>()
  for (const y of years) counts.set(y, (counts.get(y) ?? 0) + 1)
  const mostCommon = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return { min, max, mostCommonYear: mostCommon[0], mostCommonCount: mostCommon[1] }
}

export function formatBreakdown(records: RecordItem[]) {
  const counts = new Map<string, number>()
  for (const r of records) counts.set(r.format, (counts.get(r.format) ?? 0) + 1)
  return [...counts.entries()].map(([format, count]) => ({ format, count }))
}
