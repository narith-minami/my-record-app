import { ChevronRight, Flame, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GenreDonut } from '../components/charts'
import { RecordCover } from '../components/RecordCover'
import { XpToast } from '../components/XpToast'
import { Card, ProgressBar, SectionTitle } from '../components/ui'
import { useApp } from '../context/AppContext'
import { GENRE_COLORS } from '../data/mockData'
import { genreBreakdown } from '../lib/analytics'
import { relativeDate, yen } from '../lib/format'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Home() {
  const { collection, wantlist, digLog, profile, challenges, recommendations } = useApp()
  const dna = genreBreakdown(collection).sort((a, b) => b.percent - a.percent)
  const latestDig = digLog[0]
  const topWant = wantlist.find((w) => w.sightings.length > 0) ?? wantlist[0]
  const activeChallenge = challenges.find((c) => !c.completed) ?? challenges[0]

  return (
    <div className="flex min-h-svh flex-col bg-[#0b0b0f] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0b0f]/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40">
              {greeting()}, {profile.name}
            </p>
            <h1 className="text-lg font-semibold">DIG</h1>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"
          >
            <Flame className="size-3.5 text-fuchsia-400" />
            <span className="text-xs font-semibold">Lv.{profile.level}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 pb-28 pt-4">
        <Link to="/dna" className="block">
          <Card>
            <SectionTitle right={<ChevronRight className="size-4 text-white/30" />}>あなたのDIG DNA</SectionTitle>
            <div className="flex items-center gap-4">
              <GenreDonut data={dna} size={96} />
              <ul className="flex-1 space-y-1.5">
                {dna.slice(0, 4).map((d) => (
                  <li key={d.genre} className="flex items-center gap-2 text-xs">
                    <span className="size-2 rounded-full" style={{ background: GENRE_COLORS[d.genre] }} />
                    <span className="flex-1 truncate text-white/65">{d.genre}</span>
                    <span className="font-semibold text-white/85">{d.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Link>

        {recommendations[0] && (
          <Link to="/discover" className="block">
            <Card>
              <SectionTitle right={<ChevronRight className="size-4 text-white/30" />}>あなたへのおすすめ</SectionTitle>
              <div className="flex items-center gap-3">
                <RecordCover color={recommendations[0].color} artist={recommendations[0].artist} title={recommendations[0].title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{recommendations[0].artist}</p>
                  <p className="truncate text-xs text-white/55">{recommendations[0].title}</p>
                </div>
                <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-2 py-1 text-[11px] font-bold text-fuchsia-300">
                  Match {recommendations[0].matchScore}%
                </span>
              </div>
            </Card>
          </Link>
        )}

        {latestDig && (
          <Link to="/log" className="block">
            <Card>
              <SectionTitle right={<ChevronRight className="size-4 text-white/30" />}>最近の発見</SectionTitle>
              <div className="flex items-center gap-3">
                <RecordCover color={latestDig.color} artist={latestDig.artist} title={latestDig.title} format={latestDig.format} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[11px] text-white/40">
                    <MapPin className="size-3" />
                    {relativeDate(latestDig.date)}・{latestDig.store}
                  </p>
                  <p className="truncate text-sm font-semibold">{latestDig.artist}</p>
                  <p className="truncate text-xs text-white/55">{latestDig.title}</p>
                </div>
                {latestDig.price != null && <span className="text-xs font-semibold text-white/70">{yen(latestDig.price)}</span>}
              </div>
            </Card>
          </Link>
        )}

        {topWant && (
          <Link to="/want" className="block">
            <Card>
              <SectionTitle right={<ChevronRight className="size-4 text-white/30" />}>あなたのWantlist</SectionTitle>
              <div className="flex items-center gap-3">
                <RecordCover color={topWant.color} artist={topWant.artist} title={topWant.title} format={topWant.format} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {topWant.artist} - {topWant.title}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {topWant.sightings.length > 0
                      ? `${topWant.sightings[0].area}で${topWant.sightings.length}件の目撃情報`
                      : '目撃情報なし'}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {activeChallenge && (
          <Link to="/challenges" className="block">
            <Card>
              <SectionTitle right={<ChevronRight className="size-4 text-white/30" />}>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-400" />
                  今週のチャレンジ
                </span>
              </SectionTitle>
              <p className="mb-2 text-sm font-medium text-white/80">{activeChallenge.title}</p>
              <ProgressBar value={activeChallenge.progress} max={activeChallenge.target} colorClass="bg-amber-400" />
              <p className="mt-1.5 text-[11px] text-white/40">
                {activeChallenge.progress} / {activeChallenge.target} ・ 報酬 XP{activeChallenge.xpReward}
              </p>
            </Card>
          </Link>
        )}
      </main>
      <XpToast />
    </div>
  )
}
