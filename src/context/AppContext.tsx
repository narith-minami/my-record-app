import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  badgeDefs,
  challengeDefs,
  digLog as initialDigLog,
  initialCollection,
  initialProfile,
  initialWantlist,
  nextId,
  recommendationPool,
} from '../data/mockData'
import { weeklyCheapFindCount, weeklyNewArtistCount, weeklyStoreCount } from '../lib/analytics'
import type {
  Badge,
  Challenge,
  DigLogEntry,
  DnaMode,
  Format,
  Genre,
  RecordItem,
  RecommendedRecord,
  Sighting,
  UserProfile,
  WantItem,
} from '../types'

const STORAGE_KEY = 'dig-app-state-v1'

interface PersistedState {
  collection: RecordItem[]
  wantlist: WantItem[]
  digLog: DigLogEntry[]
  profile: UserProfile
  dnaMode: DnaMode
  claimedChallenges: string[]
}

interface XpToast {
  id: string
  amount: number
  reason: string
}

interface AppContextValue extends PersistedState {
  badges: Badge[]
  challenges: Challenge[]
  recommendations: RecommendedRecord[]
  xpToast: XpToast | null
  dismissXpToast: () => void
  addRecord: (input: {
    artist: string
    title: string
    format: Format
    genre: Genre
    label?: string
    year?: number
    price?: number
    store?: string
    notes?: string
    color?: [string, string]
  }) => void
  addWant: (input: { artist: string; title: string; format: Format; color?: [string, string]; note?: string }) => void
  addSighting: (wantId: string, sighting: Omit<Sighting, 'id'>) => void
  removeWant: (wantId: string) => void
  addDigLogEntry: (input: Omit<DigLogEntry, 'id'>) => void
  setDnaMode: (mode: DnaMode) => void
  toggleSpotify: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState
      return {
        collection: parsed.collection ?? initialCollection,
        wantlist: parsed.wantlist ?? initialWantlist,
        digLog: parsed.digLog ?? initialDigLog,
        profile: parsed.profile ?? initialProfile,
        dnaMode: parsed.dnaMode ?? 'collection',
        claimedChallenges: parsed.claimedChallenges ?? [],
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return {
    collection: initialCollection,
    wantlist: initialWantlist,
    digLog: initialDigLog,
    profile: initialProfile,
    dnaMode: 'collection',
    claimedChallenges: [],
  }
}

const GENRE_PALETTE: Record<Genre, [string, string]> = {
  '90s R&B': ['#7c3aed', '#db2777'],
  'New Jack Swing': ['#2563eb', '#06b6d4'],
  'Hip-Hop': ['#ea580c', '#dc2626'],
  'Soul/Funk': ['#b45309', '#eab308'],
  Others: ['#0f766e', '#16a34a'],
}

function levelUp(profile: UserProfile, amount: number): UserProfile {
  let { level, xp, xpToNext } = profile
  xp += amount
  while (xp >= xpToNext) {
    xp -= xpToNext
    level += 1
    xpToNext = Math.round(xpToNext * 1.08 + 400)
  }
  return { ...profile, level, xp, xpToNext }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState)
  const [xpToast, setXpToast] = useState<XpToast | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const grantXp = useCallback((amount: number, reason: string) => {
    setState((prev) => ({ ...prev, profile: levelUp(prev.profile, amount) }))
    setXpToast({ id: nextId('toast'), amount, reason })
  }, [])

  const dismissXpToast = useCallback(() => setXpToast(null), [])

  const addRecord = useCallback<AppContextValue['addRecord']>(
    (input) => {
      setState((prev) => {
        const record: RecordItem = {
          id: nextId('rec'),
          artist: input.artist,
          title: input.title,
          format: input.format,
          genre: input.genre,
          label: input.label,
          year: input.year,
          color: input.color ?? GENRE_PALETTE[input.genre],
          addedAt: new Date().toISOString().slice(0, 10),
          price: input.price,
          store: input.store,
          notes: input.notes,
        }
        return { ...prev, collection: [record, ...prev.collection] }
      })
      grantXp(10, `${input.artist} - ${input.title} をコレクションに追加`)
    },
    [grantXp],
  )

  const addWant = useCallback<AppContextValue['addWant']>(
    (input) => {
      setState((prev) => ({
        ...prev,
        wantlist: [
          {
            id: nextId('want'),
            artist: input.artist,
            title: input.title,
            format: input.format,
            color: input.color ?? ['#7c3aed', '#db2777'],
            addedAt: new Date().toISOString().slice(0, 10),
            sightings: [],
            note: input.note,
          },
          ...prev.wantlist,
        ],
      }))
      grantXp(5, `${input.artist} - ${input.title} をWantに追加`)
    },
    [grantXp],
  )

  const addSighting = useCallback<AppContextValue['addSighting']>((wantId, sighting) => {
    setState((prev) => ({
      ...prev,
      wantlist: prev.wantlist.map((w) =>
        w.id === wantId ? { ...w, sightings: [{ id: nextId('sight'), ...sighting }, ...w.sightings] } : w,
      ),
    }))
  }, [])

  const removeWant = useCallback<AppContextValue['removeWant']>((wantId) => {
    setState((prev) => ({ ...prev, wantlist: prev.wantlist.filter((w) => w.id !== wantId) }))
  }, [])

  const addDigLogEntry = useCallback<AppContextValue['addDigLogEntry']>(
    (input) => {
      setState((prev) => ({ ...prev, digLog: [{ id: nextId('log'), ...input }, ...prev.digLog] }))
      grantXp(25, `${input.store} で発見を記録`)
    },
    [grantXp],
  )

  const setDnaMode = useCallback<AppContextValue['setDnaMode']>((mode) => {
    setState((prev) => ({ ...prev, dnaMode: mode }))
  }, [])

  const toggleSpotify = useCallback(() => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, spotifyConnected: !prev.profile.spotifyConnected } }))
  }, [])

  // derived: challenge progress (computed live from collection/digLog) + auto XP grant on completion
  const challenges = useMemo<Challenge[]>(() => {
    const newArtists = weeklyNewArtistCount(state.collection)
    const stores = weeklyStoreCount(state.digLog)
    const cheapFinds = weeklyCheapFindCount(state.collection, state.digLog)
    return challengeDefs.map((def) => {
      let progress = 0
      if (def.id === 'c1') progress = Math.min(newArtists, def.target)
      if (def.id === 'c2') progress = Math.min(stores, def.target)
      if (def.id === 'c3') progress = Math.min(cheapFinds, def.target)
      const completed = progress >= def.target
      return { ...def, progress, completed }
    })
  }, [state.collection, state.digLog])

  useEffect(() => {
    const toClaim = challenges.filter((c) => c.completed && !state.claimedChallenges.includes(c.id))
    if (toClaim.length === 0) return
    setState((prev) => ({ ...prev, claimedChallenges: [...prev.claimedChallenges, ...toClaim.map((c) => c.id)] }))
    toClaim.forEach((c) => grantXp(c.xpReward, `チャレンジ達成: ${c.title}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges])

  const badges = useMemo<Badge[]>(() => {
    const genres = new Set(state.collection.map((r) => r.genre))
    const formats = new Set(state.collection.map((r) => r.format))
    const njsCount = state.collection.filter((r) => r.genre === 'New Jack Swing').length
    const stores = new Set(state.digLog.map((l) => l.store))
    const anyCheap = state.collection.some((r) => (r.price ?? Infinity) <= 1000) || state.digLog.some((l) => (l.price ?? Infinity) <= 1000)
    const dynamicEarned: Record<string, boolean> = {
      b1: state.collection.length >= 1,
      b2: state.collection.length >= 25,
      b3: genres.size >= 5,
      b4: njsCount >= 5,
      b5: formats.has('LP') && formats.has('12"') && formats.has('7"'),
      b6: anyCheap,
      b7: stores.size >= 3,
      b9: state.collection.length >= 100,
      b10: state.profile.spotifyConnected && state.dnaMode === 'integrated',
    }
    return badgeDefs.map((b) => (b.id in dynamicEarned ? { ...b, earned: dynamicEarned[b.id] } : b))
  }, [state])

  const recommendations = useMemo<RecommendedRecord[]>(() => {
    if (state.dnaMode === 'collection') return recommendationPool.map((r) => ({ ...r, matchScore: Math.max(60, r.matchScore - 8) }))
    if (state.dnaMode === 'spotify' && !state.profile.spotifyConnected) return []
    return recommendationPool
  }, [state.dnaMode, state.profile.spotifyConnected])

  const value: AppContextValue = {
    ...state,
    badges,
    challenges,
    recommendations,
    xpToast,
    dismissXpToast,
    addRecord,
    addWant,
    addSighting,
    removeWant,
    addDigLogEntry,
    setDnaMode,
    toggleSpotify,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
