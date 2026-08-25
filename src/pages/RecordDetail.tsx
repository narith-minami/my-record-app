import { Navigate, useParams } from 'react-router-dom'
import { RecordCover } from '../components/RecordCover'
import { Screen } from '../components/Screen'
import { Card } from '../components/ui'
import { useApp } from '../context/AppContext'
import { yen } from '../lib/format'

export function RecordDetail() {
  const { id } = useParams()
  const { collection } = useApp()
  const record = collection.find((r) => r.id === id)

  if (!record) return <Navigate to="/collection" replace />

  return (
    <Screen title={record.artist} back>
      <div className="mb-4 max-w-[220px]">
        <RecordCover color={record.color} artist={record.artist} title={record.title} format={record.format} size="lg" />
      </div>
      <h2 className="text-xl font-semibold">{record.title}</h2>
      <p className="mt-0.5 text-sm text-white/50">{record.artist}</p>

      <Card className="mt-4 divide-y divide-white/8">
        <DetailRow label="フォーマット" value={record.format} />
        <DetailRow label="ジャンル" value={record.genre} />
        {record.label && <DetailRow label="レーベル" value={record.label} />}
        {record.year && <DetailRow label="発売年" value={String(record.year)} />}
        {record.price != null && <DetailRow label="購入価格" value={yen(record.price)} />}
        {record.store && <DetailRow label="購入店舗" value={record.store} />}
        <DetailRow label="登録日" value={record.addedAt} />
      </Card>

      {record.notes && (
        <Card className="mt-3">
          <p className="text-xs text-white/40">メモ</p>
          <p className="mt-1 text-sm text-white/75">{record.notes}</p>
        </Card>
      )}
    </Screen>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <span className="text-xs text-white/45">{label}</span>
      <span className="text-sm font-medium text-white/85">{value}</span>
    </div>
  )
}
