interface RecordCoverProps {
  color: [string, string]
  artist: string
  title: string
  size?: 'sm' | 'md' | 'lg'
  format?: string
}

const sizeClasses: Record<NonNullable<RecordCoverProps['size']>, string> = {
  sm: 'size-12 rounded-md text-[9px]',
  md: 'size-16 rounded-lg text-xs',
  lg: 'aspect-square w-full rounded-xl text-2xl',
}

export function RecordCover({ color, artist, title, size = 'md', format }: RecordCoverProps) {
  const initials = artist
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-bold text-white/90 shadow-inner ${sizeClasses[size]}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${color[0]}, ${color[1]})` }}
      title={`${artist} - ${title}`}
    >
      <span className="drop-shadow">{initials}</span>
      <div className="absolute inset-0 bg-black/10" />
      <div
        className="absolute -right-3 -top-3 size-8 rounded-full border border-white/10"
        style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.25) 0%, transparent 70%)' }}
      />
      {format && size !== 'sm' && (
        <span className="absolute bottom-1 right-1 rounded bg-black/40 px-1 py-0.5 text-[8px] font-semibold tracking-wide text-white/80">
          {format}
        </span>
      )}
    </div>
  )
}
