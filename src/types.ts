export type Format = 'LP' | '12"' | '7"'

export type Genre = '90s R&B' | 'New Jack Swing' | 'Hip-Hop' | 'Soul/Funk' | 'Others'

export interface RecordItem {
  id: string
  artist: string
  title: string
  format: Format
  genre: Genre
  label?: string
  year?: number
  color: [string, string]
  addedAt: string
  price?: number
  store?: string
  notes?: string
}

export interface Sighting {
  id: string
  store: string
  area: string
  date: string
  price?: number
  note?: string
}

export interface WantItem {
  id: string
  artist: string
  title: string
  format: Format
  color: [string, string]
  addedAt: string
  sightings: Sighting[]
  note?: string
}

export interface DigLogEntry {
  id: string
  artist: string
  title: string
  format: Format
  color: [string, string]
  store: string
  area: string
  price?: number
  date: string
  note?: string
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earned: boolean
  earnedAt?: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  progress: number
  target: number
  xpReward: number
  completed: boolean
}

export type DnaMode = 'collection' | 'spotify' | 'integrated'

export interface UserProfile {
  name: string
  handle: string
  since: string
  level: number
  xp: number
  xpToNext: number
  spotifyConnected: boolean
  following: number
}

export interface RecommendedRecord {
  id: string
  artist: string
  title: string
  color: [string, string]
  matchScore: number
  reasons: string[]
}
