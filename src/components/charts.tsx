import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { GENRE_COLORS } from '../data/mockData'
import type { GenreSlice } from '../lib/analytics'

export function GenreDonut({ data, size = 128 }: { data: GenreSlice[]; size?: number }) {
  const chartData = data.filter((d) => d.count > 0)
  return (
    <div style={{ width: size, height: size }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="percent"
            nameKey="genre"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map((d) => (
              <Cell key={d.genre} fill={GENRE_COLORS[d.genre]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function GenreRadar({ data, size = 260 }: { data: GenreSlice[]; size?: number }) {
  const maxPercent = Math.max(1, ...data.map((d) => d.percent))
  const chartData = data.map((d) => ({
    genre: d.genre.replace(' ', '\n'),
    value: Math.round((d.percent / maxPercent) * 100),
    percent: d.percent,
  }))
  return (
    <div style={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="68%">
          <PolarGrid stroke="rgba(255,255,255,0.14)" />
          <PolarAngleAxis dataKey="genre" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }} />
          <PolarRadiusAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="#c084fc" fill="#c084fc" fillOpacity={0.4} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
