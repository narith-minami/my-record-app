import { Compass, Crown, Disc, Flame, Layers, MapPin, Sparkles, Tag, Trophy, Zap, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  disc: Disc,
  crown: Crown,
  compass: Compass,
  zap: Zap,
  layers: Layers,
  tag: Tag,
  'map-pin': MapPin,
  flame: Flame,
  trophy: Trophy,
  sparkles: Sparkles,
}

export function badgeIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles
}
