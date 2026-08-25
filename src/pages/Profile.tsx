import { Award, Disc3, MapPin, Music2, TrendingUp, User } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { Card, ProgressBar, SectionTitle } from '../components/ui'
import { useApp } from '../context/AppContext'
import { badgeIcon } from '../lib/badgeIcon'

export function Profile() {
  const { profile, collection, badges, digLog, toggleSpotify } = useApp()
  const earnedBadges = badges.filter((b) => b.earned)
  const storeCount = new Set(digLog.map((l) => l.store)).size
  const weeklyDigs = useMemo(() => {
    const now = Date.now()
    return digLog.filter((l) => (now - new Date(`${l.date}T00:00:00`).getTime()) / 86_400_000 <= 7).length
  }, [digLog])

  return (
    <Screen title="Profile" back>
      <div className="flex items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-700 text-xl font-bold">
          {profile.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{profile.name}</p>
          <p className="truncate text-xs text-white/40">{profile.handle}</p>
          <p className="mt-0.5 text-[11px] text-white/30">DIG SINCE {profile.since}</p>
        </div>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-fuchsia-300">Lv.{profile.level} CRATE DIGGER</span>
          <span className="text-white/40">
            {profile.xp.toLocaleString()} / {profile.xpToNext.toLocaleString()} XP
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar value={profile.xp} max={profile.xpToNext} />
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat icon={<Disc3 className="size-4" />} value={collection.length} label="COLLECTION" />
        <Stat icon={<Award className="size-4" />} value={earnedBadges.length} label="BADGES" />
        <Stat icon={<MapPin className="size-4" />} value={storeCount} label="STORES" />
        <Stat icon={<TrendingUp className="size-4" />} value={weeklyDigs} label="WEEKLY DIGS" />
      </div>

      <Card className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Music2 className="size-4 text-emerald-400" />
          <div>
            <p className="text-sm font-medium">Spotify連携</p>
            <p className="text-[11px] text-white/40">{profile.spotifyConnected ? '連携中' : '未連携'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSpotify}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
            profile.spotifyConnected ? 'bg-white/10 text-white/60' : 'bg-emerald-500 text-black'
          }`}
        >
          {profile.spotifyConnected ? '連携解除' : '連携する'}
        </button>
      </Card>

      <div className="mt-5">
        <SectionTitle
          right={
            <Link to="/challenges" className="text-xs font-medium text-fuchsia-300">
              チャレンジを見る
            </Link>
          }
        >
          主なバッジ ({earnedBadges.length}/{badges.length})
        </SectionTitle>
        {earnedBadges.length === 0 ? (
          <p className="text-xs text-white/35">まだバッジがありません</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {earnedBadges.map((b) => {
              const Icon = badgeIcon(b.icon)
              return (
                <div key={b.id} className="flex flex-col items-center gap-1.5 text-center" title={b.description}>
                  <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/25 to-fuchsia-500/25 text-amber-300">
                    <Icon className="size-5" />
                  </div>
                  <p className="line-clamp-2 text-[10px] leading-tight text-white/55">{b.name}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-5">
        <SectionTitle>最近のアクティビティ</SectionTitle>
        <ul className="space-y-2.5">
          {digLog.slice(0, 5).map((entry) => (
            <li key={entry.id} className="flex items-center gap-2.5 text-xs">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/40">
                <User className="size-3.5" />
              </div>
              <span className="text-white/55">
                {entry.store}で{entry.artist} - {entry.title}を発見しました
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  )
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] py-3">
      <div className="text-white/40">{icon}</div>
      <p className="text-base font-semibold">{value}</p>
      <p className="text-[9px] tracking-wide text-white/35">{label}</p>
    </div>
  )
}
