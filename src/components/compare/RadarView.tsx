import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import type { CompareRow } from '@/lib/api'

interface RadarViewProps {
  rows: CompareRow[]
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6']

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
}

function normalize(value: number | null, min: number, max: number): number {
  if (value === null || value === undefined || !isFinite(value)) return 0
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

export function RadarView({ rows }: RadarViewProps) {
  if (rows.length === 0) return null

  // Compute normalization ranges
  const trustScores = rows.map((r) => r.trust_score).filter((v): v is number => v !== null)
  const facBounds = rows.map((r) => r.fac_bound).filter((v): v is number => v !== null)
  const faithAucs = rows.map((r) => r.faithfulness_auc).filter((v): v is number => v !== null)
  const lChains = rows.map((r) => r.l_chain).filter((v): v is number => v !== null)
  const eces = rows.map((r) => r.ece).filter((v): v is number => v !== null)

  const radarData = [
    { axis: 'Trust Score' },
    { axis: 'FAC Bound' },
    { axis: 'Faith AUC' },
    { axis: 'Stability' },
    { axis: 'Calibration' },
  ]

  // Build per-model data
  const modelData = rows.map((row, idx) => {
    const stability = row.l_chain !== null ? Math.min(1, 1 / (row.l_chain + 0.001)) : null
    const calibration = row.ece !== null ? Math.max(0, 1 - row.ece) : null

    return {
      ...row,
      color: COLORS[idx % COLORS.length],
      radarValues: {
        'Trust Score': normalize(row.trust_score, Math.min(...trustScores, 0), Math.max(...trustScores, 1)),
        'FAC Bound': normalize(row.fac_bound, Math.min(...facBounds, 0), Math.max(...facBounds, 1)),
        'Faith AUC': normalize(row.faithfulness_auc, Math.min(...faithAucs, 0), Math.max(...faithAucs, 1)),
        'Stability': stability !== null ? normalize(stability, 0, 1) : 0,
        'Calibration': calibration !== null ? normalize(calibration, Math.max(0, 1 - Math.max(...eces)), 1) : 0,
      },
    }
  })

  // Flatten into recharts format: [{axis, ...model values}]
  const chartData = radarData.map((d) => {
    const point: Record<string, unknown> = { axis: d.axis }
    modelData.forEach((m) => {
      point[m.id] = m.radarValues[d.axis as keyof typeof m.radarValues]
    })
    return point
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Radar Comparison
        </CardTitle>
        <p className="text-xs text-zinc-500 font-mono mt-0.5">
          All metrics normalized 0-1. Stability = 1 / (L_chain + 0.001) capped at 1. Calibration = 1 - ECE.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#a1a1aa', fontSize: 12, fontFamily: 'monospace' }}
            />
            {modelData.map((m) => (
              <Radar
                key={m.id}
                name={m.name}
                dataKey={m.id}
                stroke={m.color}
                fill={m.color}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{ r: 3, fill: m.color }}
              />
            ))}
            <RechartsTooltip
              {...TOOLTIP_STYLE}
              formatter={(v: number, name: string) => [v.toFixed(3), name]}
            />
            <Legend
              wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px', paddingTop: '12px' }}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
