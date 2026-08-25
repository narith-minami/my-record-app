import { Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export function XpToast() {
  const { xpToast, dismissXpToast } = useApp()

  useEffect(() => {
    if (!xpToast) return
    const t = setTimeout(dismissXpToast, 2600)
    return () => clearTimeout(t)
  }, [xpToast, dismissXpToast])

  if (!xpToast) return null

  return (
    <div
      key={xpToast.id}
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto flex max-w-[430px] justify-center px-4"
    >
      <div className="flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-[#1a1a22] px-4 py-2 shadow-lg shadow-fuchsia-950/40 animate-[fade-up_0.25s_ease-out]">
        <Sparkles className="size-4 text-fuchsia-400" />
        <span className="text-sm font-semibold text-fuchsia-300">+{xpToast.amount} XP</span>
        <span className="text-xs text-white/60">{xpToast.reason}</span>
      </div>
    </div>
  )
}
