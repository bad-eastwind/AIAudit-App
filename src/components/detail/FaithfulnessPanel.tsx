import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { safeNum, faithVerdictBg } from '@/lib/formatters'
import { readFaithfulness } from './metricGuide'
import { BottomLine, MetricRow } from './MetricRow'

interface FaithfulnessPanelProps {
  faithfulness: Record<string, unknown>
  modelName: string
}

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  labelStyle: { color: '#a1a1aa' },
  itemStyle: { color: '#e4e4e7' },
}

export function FaithfulnessPanel({ faithfulness, modelName }: FaithfulnessPanelProps) {
  const summary = readFaithfulness(faithfulness, modelName)
  const auc = typeof faithfulness.auc === 'number' ? faithfulness.auc : null
  const ciLower = typeof faithfulness.ci_lower === 'number' ? faithfulness.ci_lower : null
  const ciUpper = typeof faithfulness.ci_upper === 'number' ? faithfulness.ci_upper : null
  const verdict = typeof faithfulness.verdict === 'string' ? faithfulness.verdict : null

  // per_layer_correlations is [string, float][]
  const rawLayers = faithfulness.per_layer_correlations
  const layerData: Array<{ layer: string; value: number }> = Array.isArray(rawLayers)
    ? (rawLayers as Array<[string, number]>).map(([layer, value]) => ({ layer, value }))
    : []

  // ssim_curve
  const ssimCurve = Array.isArray(faithfulness.ssim_curve)
    ? (faithfulness.ssim_curve as number[]).map((v, i) => ({ i, ssim: v }))
    : null

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Faithfulness
            </CardTitle>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">Does the heatmap depend on what the model learned?</p>
          </div>
          {verdict && (
            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${faithVerdictBg(verdict)}`}>
              {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <BottomLine level={summary.level} title={`What this means for ${modelName}`} text={summary.bottomLine} />

        {/* AUC with CI bar */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-mono font-bold tabular-nums text-zinc-100">
              {safeNum(auc, 3)}
            </span>
            <span className="text-sm text-zinc-500 font-mono">AUC</span>
          </div>
          {ciLower !== null && ciUpper !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-zinc-500 font-mono mb-1">
                <span>CI lower: {safeNum(ciLower, 3)}</span>
                <span>CI upper: {safeNum(ciUpper, 3)}</span>
              </div>
              {/* SVG range bar */}
              <svg width="100%" height="20" className="overflow-visible">
                <rect x="0" y="8" width="50%" height="4" rx="2" fill="#7f1d1d" opacity="0.6" />
                <rect x="50%" y="8" width="20%" height="4" fill="#78350f" opacity="0.6" />
                <rect x="70%" y="8" width="30%" height="4" rx="2" fill="#064e3b" opacity="0.7" />
                <line x1="50%" x2="50%" y1="3" y2="17" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="2 2" />
                <rect
                  x={`${ciLower * 100}%`}
                  y="6"
                  width={`${(ciUpper - ciLower) * 100}%`}
                  height="8"
                  rx="2"
                  fill="#6366f1"
                  opacity="0.7"
                />
                {auc !== null && (
                  <circle
                    cx={`${auc * 100}%`}
                    cy="10"
                    r="5"
                    fill="#818cf8"
                    stroke="#09090b"
                    strokeWidth="1.5"
                  />
                )}
              </svg>
              <div className="flex justify-between text-xs text-zinc-600 font-mono mt-0.5">
                <span>0.0 decorative</span>
                <span>0.5 coin flip</span>
                <span>1.0 faithful</span>
              </div>
            </div>
          )}
        </div>

        {/* Per-layer bar chart */}
        {layerData.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">Per-layer correlation: should fall toward 0 as more layers are scrambled</p>
            <ResponsiveContainer width="100%" height={Math.max(80, layerData.length * 28)}>
              <BarChart data={layerData} layout="vertical" margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
                <XAxis
                  type="number"
                  domain={[-1, 1]}
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />
                <YAxis
                  type="category"
                  dataKey="layer"
                  width={52}
                  tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [v.toFixed(4), 'corr']}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 3, 3, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SSIM sparkline */}
        {ssimCurve && ssimCurve.length > 1 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">Heatmap similarity to original after each scramble (lower is better)</p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={ssimCurve} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <XAxis dataKey="i" hide />
                <YAxis domain={[0, 1]} hide />
                <RechartsTooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toFixed(4), 'ssim']} />
                <Area
                  type="monotone"
                  dataKey="ssim"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Metric-by-metric reading */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-mono">Score by score</p>
          {summary.readings.map((m) => (
            <MetricRow key={m.id} m={m} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
