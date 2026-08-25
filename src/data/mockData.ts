import type {
  Badge,
  Challenge,
  DigLogEntry,
  RecommendedRecord,
  RecordItem,
  UserProfile,
  WantItem,
} from '../types'

let seq = 0
export function nextId(prefix: string): string {
  seq += 1
  return `${prefix}-${seq}-${Date.now().toString(36)}`
}

export const GENRE_COLORS: Record<string, string> = {
  '90s R&B': '#c084fc',
  'New Jack Swing': '#38bdf8',
  'Hip-Hop': '#fb923c',
  'Soul/Funk': '#facc15',
  Others: '#34d399',
}

export const initialCollection: RecordItem[] = [
  { id: nextId('rec'), artist: 'Aaliyah', title: 'One in a Million', format: 'LP', genre: '90s R&B', label: 'Background/Atlantic', year: 1996, color: ['#7c3aed', '#db2777'], addedAt: '2026-08-03' },
  { id: nextId('rec'), artist: 'TLC', title: 'CrazySexyCool', format: 'LP', genre: '90s R&B', label: 'LaFace', year: 1994, color: ['#7c3aed', '#db2777'], addedAt: '2026-07-29' },
  { id: nextId('rec'), artist: 'Mary J. Blige', title: "What's the 411?", format: 'LP', genre: '90s R&B', label: 'Uptown', year: 1992, color: ['#7c3aed', '#db2777'], addedAt: '2026-08-15' },
  { id: nextId('rec'), artist: 'Mary J. Blige', title: 'My Life', format: 'LP', genre: '90s R&B', label: 'MCA', year: 1994, color: ['#7c3aed', '#db2777'], addedAt: '2026-08-10' },
  { id: nextId('rec'), artist: 'SWV', title: "You're the One", format: '12"', genre: '90s R&B', label: 'RCA', year: 1996, color: ['#7c3aed', '#db2777'], addedAt: '2026-08-23', price: 1280, store: '○○RECORDS' },
  { id: nextId('rec'), artist: 'Boyz II Men', title: 'II', format: 'LP', genre: '90s R&B', label: 'Motown', year: 1994, color: ['#7c3aed', '#db2777'], addedAt: '2026-08-05' },
  { id: nextId('rec'), artist: 'Boyz II Men', title: 'Cooleyhighharmony', format: 'LP', genre: '90s R&B', label: 'Motown', year: 1991, color: ['#7c3aed', '#db2777'], addedAt: '2026-07-28' },
  { id: nextId('rec'), artist: 'Janet Jackson', title: 'janet.', format: 'LP', genre: '90s R&B', label: 'Virgin', year: 1993, color: ['#7c3aed', '#db2777'], addedAt: '2026-07-20' },
  { id: nextId('rec'), artist: 'Janet Jackson', title: 'The Velvet Rope', format: 'LP', genre: '90s R&B', label: 'Virgin', year: 1997, color: ['#7c3aed', '#db2777'], addedAt: '2026-07-15' },
  { id: nextId('rec'), artist: 'Jodeci', title: 'Forever My Lady', format: 'LP', genre: 'New Jack Swing', label: 'Uptown', year: 1991, color: ['#2563eb', '#06b6d4'], addedAt: '2026-08-12' },
  { id: nextId('rec'), artist: 'SWV', title: "It's About Time", format: 'LP', genre: 'New Jack Swing', label: 'RCA', year: 1992, color: ['#2563eb', '#06b6d4'], addedAt: '2026-07-30' },
  { id: nextId('rec'), artist: 'Az Yet', title: 'Az Yet', format: 'LP', genre: 'New Jack Swing', label: 'LaFace', year: 1996, color: ['#2563eb', '#06b6d4'], addedAt: '2026-07-22' },
  { id: nextId('rec'), artist: 'Blackstreet', title: 'Blackstreet', format: 'LP', genre: 'New Jack Swing', label: 'Interscope', year: 1994, color: ['#2563eb', '#06b6d4'], addedAt: '2026-07-10' },
  { id: nextId('rec'), artist: 'Bell Biv DeVoe', title: 'Poison', format: 'LP', genre: 'New Jack Swing', label: 'MCA', year: 1990, color: ['#2563eb', '#06b6d4'], addedAt: '2026-06-30' },
  { id: nextId('rec'), artist: 'Guy', title: 'Guy', format: 'LP', genre: 'New Jack Swing', label: 'Uptown', year: 1988, color: ['#2563eb', '#06b6d4'], addedAt: '2026-06-18' },
  { id: nextId('rec'), artist: 'Wu-Tang Clan', title: 'Enter the Wu-Tang (36 Chambers)', format: 'LP', genre: 'Hip-Hop', label: 'Loud', year: 1993, color: ['#ea580c', '#dc2626'], addedAt: '2026-08-08' },
  { id: nextId('rec'), artist: 'Wu-Tang Clan', title: 'C.R.E.A.M.', format: '12"', genre: 'Hip-Hop', label: 'Loud', year: 1993, color: ['#ea580c', '#dc2626'], addedAt: '2026-08-15', price: 990, store: '△△RECORDS' },
  { id: nextId('rec'), artist: 'A Tribe Called Quest', title: 'Midnight Marauders', format: 'LP', genre: 'Hip-Hop', label: 'Jive', year: 1993, color: ['#ea580c', '#dc2626'], addedAt: '2026-07-25' },
  { id: nextId('rec'), artist: 'A Tribe Called Quest', title: 'The Low End Theory', format: 'LP', genre: 'Hip-Hop', label: 'Jive', year: 1991, color: ['#ea580c', '#dc2626'], addedAt: '2026-07-12' },
  { id: nextId('rec'), artist: 'The Notorious B.I.G.', title: 'Ready to Die', format: 'LP', genre: 'Hip-Hop', label: 'Bad Boy', year: 1994, color: ['#ea580c', '#dc2626'], addedAt: '2026-06-25' },
  { id: nextId('rec'), artist: 'Zapp', title: 'Zapp', format: 'LP', genre: 'Soul/Funk', label: 'Warner Bros.', year: 1980, color: ['#b45309', '#eab308'], addedAt: '2026-06-15' },
  { id: nextId('rec'), artist: 'Parliament', title: 'Mothership Connection', format: 'LP', genre: 'Soul/Funk', label: 'Casablanca', year: 1975, color: ['#b45309', '#eab308'], addedAt: '2026-06-05' },
  { id: nextId('rec'), artist: 'Earth, Wind & Fire', title: "All 'N All", format: 'LP', genre: 'Soul/Funk', label: 'Columbia', year: 1977, color: ['#b45309', '#eab308'], addedAt: '2026-05-28' },
  { id: nextId('rec'), artist: "D'Angelo", title: 'Brown Sugar', format: 'LP', genre: 'Soul/Funk', label: 'EMI', year: 1995, color: ['#b45309', '#eab308'], addedAt: '2026-05-20' },
  { id: nextId('rec'), artist: 'Erykah Badu', title: 'Baduizm', format: 'LP', genre: 'Others', label: 'Kedar', year: 1997, color: ['#0f766e', '#16a34a'], addedAt: '2026-05-10' },
  { id: nextId('rec'), artist: 'Portishead', title: 'Dummy', format: 'LP', genre: 'Others', label: 'Go! Beat', year: 1994, color: ['#0f766e', '#16a34a'], addedAt: '2026-05-02' },
  { id: nextId('rec'), artist: 'Massive Attack', title: 'Blue Lines', format: 'LP', genre: 'Others', label: 'Circa', year: 1991, color: ['#0f766e', '#16a34a'], addedAt: '2026-04-20' },
]

export const initialWantlist: WantItem[] = [
  {
    id: nextId('want'),
    artist: 'Jodeci',
    title: "Freak'n You",
    format: '12"',
    color: ['#2563eb', '#06b6d4'],
    addedAt: '2026-08-01',
    sightings: [
      { id: nextId('sight'), store: '△△RECORDS', area: '渋谷', date: '2026-08-22', price: 1500 },
      { id: nextId('sight'), store: 'DIG SHIBUYA', area: '渋谷', date: '2026-08-19', price: 1800 },
    ],
  },
  {
    id: nextId('want'),
    artist: 'Aaliyah',
    title: 'Are You That Somebody',
    format: '12"',
    color: ['#7c3aed', '#db2777'],
    addedAt: '2026-07-28',
    sightings: [{ id: nextId('sight'), store: '○○RECORDS', area: '横浜', date: '2026-08-21', price: 1280 }],
  },
  {
    id: nextId('want'),
    artist: 'TLC',
    title: 'Waterfalls',
    format: '12"',
    color: ['#7c3aed', '#db2777'],
    addedAt: '2026-08-05',
    sightings: [],
    note: '目撃情報なし',
  },
  {
    id: nextId('want'),
    artist: 'Boyz II Men',
    title: "I'll Make Love To You",
    format: '7"',
    color: ['#7c3aed', '#db2777'],
    addedAt: '2026-07-18',
    sightings: [
      { id: nextId('sight'), store: 'VINYL LAB', area: '下北沢', date: '2026-08-10', price: 800, note: '新品' },
      { id: nextId('sight'), store: 'VINYL LAB', area: '下北沢', date: '2026-07-30', price: 800, note: '新品' },
      { id: nextId('sight'), store: '△△RECORDS', area: '渋谷', date: '2026-07-20', price: 900 },
    ],
  },
  {
    id: nextId('want'),
    artist: "D'Angelo",
    title: 'Voodoo',
    format: 'LP',
    color: ['#b45309', '#eab308'],
    addedAt: '2026-06-20',
    sightings: [],
  },
  {
    id: nextId('want'),
    artist: 'Az Yet',
    title: "Hard to Say I'm Sorry",
    format: '12"',
    color: ['#2563eb', '#06b6d4'],
    addedAt: '2026-06-10',
    sightings: [],
  },
  {
    id: nextId('want'),
    artist: 'The Notorious B.I.G.',
    title: 'Juicy',
    format: '12"',
    color: ['#ea580c', '#dc2626'],
    addedAt: '2026-08-14',
    sightings: [{ id: nextId('sight'), store: '△△RECORDS', area: '渋谷', date: '2026-08-16', price: 1200 }],
  },
  {
    id: nextId('want'),
    artist: 'Zhane',
    title: 'Pronounced Jah-Nay',
    format: 'LP',
    color: ['#b45309', '#eab308'],
    addedAt: '2026-05-30',
    sightings: [],
  },
]

export const digLog: DigLogEntry[] = [
  { id: nextId('log'), artist: 'SWV', title: "You're the One", format: '12"', color: ['#7c3aed', '#db2777'], store: '○○RECORDS', area: '横浜', price: 1280, date: '2026-08-23', note: '状態良好、あと6枚あり' },
  { id: nextId('log'), artist: 'A Tribe Called Quest', title: 'Midnight Marauders', format: 'LP', color: ['#ea580c', '#dc2626'], store: '○○RECORDS', area: '横浜', price: 1980, date: '2026-08-21', note: '' },
  { id: nextId('log'), artist: 'Wu-Tang Clan', title: 'C.R.E.A.M.', format: '12"', color: ['#ea580c', '#dc2626'], store: '△△RECORDS', area: '横浜', price: 990, date: '2026-08-15' },
  { id: nextId('log'), artist: 'Aaliyah', title: 'One in a Million', format: 'LP', color: ['#7c3aed', '#db2777'], store: 'DIG SHIBUYA', area: '渋谷', price: 2200, date: '2026-08-12' },
  { id: nextId('log'), artist: 'TLC', title: 'CrazySexyCool', format: 'LP', color: ['#7c3aed', '#db2777'], store: 'VINYL LAB', area: '下北沢', price: 1600, date: '2026-08-08' },
  { id: nextId('log'), artist: "Mary J. Blige", title: "What's the 411?", format: 'LP', color: ['#7c3aed', '#db2777'], store: '○○RECORDS', area: '横浜', price: 1500, date: '2026-08-01' },
  { id: nextId('log'), artist: 'Jodeci', title: 'Forever My Lady', format: 'LP', color: ['#2563eb', '#06b6d4'], store: 'DIG SHIBUYA', area: '渋谷', price: 1900, date: '2026-07-25' },
  { id: nextId('log'), artist: 'Boyz II Men', title: 'II', format: 'LP', color: ['#7c3aed', '#db2777'], store: '○○RECORDS', area: '横浜', price: 1100, date: '2026-07-18' },
  { id: nextId('log'), artist: 'Janet Jackson', title: 'janet.', format: 'LP', color: ['#7c3aed', '#db2777'], store: 'VINYL LAB', area: '下北沢', price: 1800, date: '2026-07-05' },
  { id: nextId('log'), artist: 'Wu-Tang Clan', title: 'Enter the Wu-Tang (36 Chambers)', format: 'LP', color: ['#ea580c', '#dc2626'], store: '△△RECORDS', area: '横浜', price: 2400, date: '2026-06-28' },
]

export const badgeDefs: Badge[] = [
  { id: 'b1', name: 'ファーストスピン', icon: 'disc', description: '最初の1枚を登録した', earned: true, earnedAt: '2022-04-01' },
  { id: 'b2', name: 'クレートディガー', icon: 'crown', description: 'コレクション25枚達成', earned: true, earnedAt: '2026-04-10' },
  { id: 'b3', name: 'ジャンルエクスプローラー', icon: 'compass', description: '5ジャンル以上を収集', earned: true, earnedAt: '2026-05-01' },
  { id: 'b4', name: 'ニュージャックマスター', icon: 'zap', description: 'New Jack Swingを5枚以上収集', earned: true, earnedAt: '2026-06-01' },
  { id: 'b5', name: 'フォーマットコンプ', icon: 'layers', description: 'LP / 12" / 7" すべてを収集', earned: true, earnedAt: '2026-07-01' },
  { id: 'b6', name: 'バーゲンハンター', icon: 'tag', description: '¥1,000以下で1枚ゲット', earned: true, earnedAt: '2026-08-05' },
  { id: 'b7', name: 'ストアホッパー', icon: 'map-pin', description: '3店舗以上でDIG IN', earned: true, earnedAt: '2026-08-08' },
  { id: 'b8', name: 'ウィークリーストリーク', icon: 'flame', description: '7日連続でDIG IN', earned: false },
  { id: 'b9', name: 'センチュリークラブ', icon: 'trophy', description: 'コレクション100枚達成', earned: false },
  { id: 'b10', name: 'DNAマスター', icon: 'sparkles', description: 'Spotify統合分析を実行', earned: false },
]

export const challengeDefs: Challenge[] = [
  { id: 'c1', title: '新しいアーティストを1枚追加', description: 'まだ持っていないアーティストの盤をコレクションに登録しよう', progress: 0, target: 1, xpReward: 100, completed: false },
  { id: 'c2', title: '3軒のお店を巡る', description: '今週、3つの異なる店舗でDIG INしよう', progress: 1, target: 3, xpReward: 150, completed: false },
  { id: 'c3', title: '¥1,000以下で1枚ゲットする', description: 'お得な掘り出し物を見つけよう', progress: 0, target: 1, xpReward: 100, completed: false },
]

export const recommendationPool: RecommendedRecord[] = [
  {
    id: nextId('rcm'),
    artist: 'Soul for Real',
    title: 'Candy Rain',
    color: ['#7c3aed', '#db2777'],
    matchScore: 94,
    reasons: ['90s R&Bを多く所有', 'Teddy Riley関連作品を複数所有', '1994〜96年作品の登録多め'],
  },
  {
    id: nextId('rcm'),
    artist: 'Xscape',
    title: 'Hummin’ Comin’ at ’Cha',
    color: ['#7c3aed', '#db2777'],
    matchScore: 91,
    reasons: ['女性グループR&Bの再生回数が多い', 'So So Def関連を所有', '1993〜94年作品を好む傾向'],
  },
  {
    id: nextId('rcm'),
    artist: 'Silk',
    title: 'Lose Control',
    color: ['#2563eb', '#06b6d4'],
    matchScore: 88,
    reasons: ['New Jack Swingの所有率18%', 'Keith Sweat関連作品と一致', 'Elektra在籍アーティストを複数所有'],
  },
  {
    id: nextId('rcm'),
    artist: 'Gang Starr',
    title: 'Moment of Truth',
    color: ['#ea580c', '#dc2626'],
    matchScore: 85,
    reasons: ['Hip-Hop再生回数が増加中', 'Wu-Tang / ATCQと同傾向のレーベル', '1993年前後の作品を高評価'],
  },
  {
    id: nextId('rcm'),
    artist: 'Total',
    title: 'Total',
    color: ['#7c3aed', '#db2777'],
    matchScore: 82,
    reasons: ['Bad Boy在籍アーティストを所有', 'Jodeci / SWVと近いDNA', 'Male Group R&Bとの相性が高い'],
  },
  {
    id: nextId('rcm'),
    artist: 'Roy Ayers',
    title: 'Everybody Loves the Sunshine',
    color: ['#b45309', '#eab308'],
    matchScore: 78,
    reasons: ['Soul/Funkの再生履歴と一致', 'サンプリング元アーティストとして関連度高'],
  },
]

export const initialProfile: UserProfile = {
  name: 'Narith',
  handle: '@narith_digger',
  since: '2022',
  level: 12,
  xp: 12450,
  xpToNext: 15000,
  spotifyConnected: false,
  following: 0,
}
