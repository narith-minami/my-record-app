import { Check, Sparkles } from 'lucide-react'
import { Screen } from '../components/Screen'
import { Card, ProgressBar, SectionTitle } from '../components/ui'
import { useApp } from '../context/AppContext'
import { badgeIcon } from '../lib/badgeIcon'

export function Challenges() {
  const { challenges, badges, profile } = useApp()
  const unearned = badges.filter((b) => !b.earned).slice(0, 3)

  return (
    <Screen title="Weekly Challenge" subtitle="今週のチャレンジ" back>
      <Card className="mb-4 flex items-center justify-between border-fuchsia-400/20 bg-fuchsia-500/[0.06]">
        <div>
          <p className="text-xs text-white/45">Lv.{profile.level}</p>
          <p className="text-sm font-semibold">
            XP {profile.xp.toLocaleString()} / {profile.xpToNext.toLocaleString()}
          </p>
        </div>
        <div className="w-24">
          <ProgressBar value={profile.xp} max={profile.xpToNext} />
        </div>
      </Card>

      <SectionTitle>今週のチャレンジ</SectionTitle>
      <div className="space-y-3">
        {challenges.map((c) => (
          <Card key={c.id} className={c.completed ? 'border-emerald-400/30 bg-emerald-500/[0.05]' : ''}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/90">{c.title}</p>
                <p className="mt-0.5 text-xs text-white/45">{c.description}</p>
              </div>
              {c.completed ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                  <Check className="size-3" />
                  達成
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-300">
                  XP{c.xpReward}
                </span>
              )}
            </div>
            <div className="mt-2.5">
              <ProgressBar value={c.progress} max={c.target} colorClass={c.completed ? 'bg-emerald-400' : 'bg-amber-400'} />
              <p className="mt-1 text-[11px] text-white/35">
                {c.progress} / {c.target}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {unearned.length > 0 && (
        <div className="mt-6">
          <SectionTitle right={<Sparkles className="size-3.5 text-white/30" />}>次に狙えるバッジ</SectionTitle>
          <div className="space-y-2.5">
            {unearned.map((b) => {
              const Icon = badgeIcon(b.icon)
              return (
                <Card key={b.id} className="flex items-center gap-3 opacity-70">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                    <Icon className="size-5 text-white/40" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/75">{b.name}</p>
                    <p className="truncate text-xs text-white/40">{b.description}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </Screen>
  )
}
