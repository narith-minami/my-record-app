export function relativeDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  const diffDays = Math.round((now.setHours(0, 0, 0, 0) - date.getTime()) / 86_400_000)
  if (diffDays <= 0) return '今日'
  if (diffDays === 1) return '1日前'
  if (diffDays < 7) return `${diffDays}日前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
  return `${Math.floor(diffDays / 30)}ヶ月前`
}

export function yen(amount?: number): string {
  if (typeof amount !== 'number') return ''
  return `¥${amount.toLocaleString('ja-JP')}`
}
