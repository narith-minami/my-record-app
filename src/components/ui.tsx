import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/8 bg-white/[0.03] p-4 ${className}`}>{children}</div>
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-white/85">{children}</h2>
      {right}
    </div>
  )
}

export function ProgressBar({ value, max, colorClass = 'bg-fuchsia-500' }: { value: number; max: number; colorClass?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${colorClass} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-300'
          : 'border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  )
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
      {icon}
      <p className="text-sm font-medium text-white/60">{title}</p>
      {hint && <p className="text-xs text-white/35">{hint}</p>}
    </div>
  )
}
