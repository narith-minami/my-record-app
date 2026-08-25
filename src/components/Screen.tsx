import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { XpToast } from './XpToast'

interface ScreenProps {
  title: string
  subtitle?: string
  back?: boolean
  right?: ReactNode
  children: ReactNode
  accent?: string
}

export function Screen({ title, subtitle, back, right, children, accent }: ScreenProps) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-svh flex-col bg-[#0b0b0f] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0b0f]/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-2">
          {back && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="-ml-1.5 flex size-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
              aria-label="戻る"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight" style={accent ? { color: accent } : undefined}>
              {title}
            </h1>
            {subtitle && <p className="mt-0.5 truncate text-xs text-white/45">{subtitle}</p>}
          </div>
          {right}
        </div>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <XpToast />
    </div>
  )
}
