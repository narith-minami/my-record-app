import { Compass, Disc3, Heart, Home, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'HOME', icon: Home, end: true },
  { to: '/collection', label: 'COLLECTION', icon: Disc3 },
  { to: '/log', label: 'MY DIG', icon: Compass },
  { to: '/want', label: 'WANT', icon: Heart },
  { to: '/profile', label: 'PROFILE', icon: User },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-white/10 bg-[#111116]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="flex items-stretch justify-between px-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium tracking-wide transition-colors ${
                  isActive ? 'text-fuchsia-400' : 'text-white/40 hover:text-white/70'
                }`
              }
            >
              <Icon className="size-5" strokeWidth={2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
