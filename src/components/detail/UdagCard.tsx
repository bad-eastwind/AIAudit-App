import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Explainer } from './Explainer'
import { pct, safeNum } from '@/lib/formatters'

const AXES = [
  { key: 'visual_u', label: 'Visual', hint: 'image readability' },
  { key: 'diagnostic_u', label: 'Diagnostic', hint: 'class confusion' },
  { key: 'temporal_u', label: 'Temporal', hint: 'stability over time' },
  { key: 'explanatory_u', label: 'Explanatory', hint: 'explanation faithfulness' },
] as const

function isNum(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v)
}

/** True only when the report carries a usable UDAG block. */
export function hasUdag(udag: unknown): udag is Record<string, unknown> {
  if (!udag || typeof udag !== 'object') return false
  const u = udag as Record<string, unknown>
  return isNum(u.reliability) || AXES.some((a) => isNum(u[a.key]))
}

export function UdagCard({ udag }: { udag: Record<string, unknown> }) {
  const reliability = isNum(udag.reliability) ? udag.reliability : null
  const axisVals = AXES.map((a) => ({ label: a.label, v: udag[a.key] })).filter((a) => isNum(a.v)) as {
    label: string
    v: number
  }[]
  const top = axisVals.sort((a, b) => b.v - a.v)[0]
  const live =
    reliability === null
      ? null
      : `reliability ${pct(reliability)}. ` +
        (top && top.v >= 0.3
          ? `The biggest source of doubt is ${top.label} (${top.v.toFixed(2)}).`
          : 'No axis shows strong doubt.')

  // Temporal has no video signal for a single image: the audit fills it with
  // (diagnostic floor gate) x Diagnostic. Say so when that is what the data shows.
  const gates = (udag.floor_gates ?? {}) as Record<string, unknown>
  const gate = isNum(gates.diagnostic_floor_gate) ? gates.diagnostic_floor_gate : null
  const tc = udag.temporal_contrib
  const temporalEmpty = !tc || (typeof tc === 'object' && Object.keys(tc as object).length === 0)
  const temporalDerived =
    temporalEmpty &&
    gate !== null &&
    isNum(udag.temporal_u) &&
    isNum(udag.diagnostic_u) &&
    Math.abs(udag.temporal_u - gate * udag.diagnostic_u) < 1e-6

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          N3: UDAG
        </CardTitle>
        <p className="text-xs text-zinc-500 font-mono mt-1">Hierarchical Uncertainty DAG</p>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <span className="text-4xl font-mono font-bold tabular-nums text-cyan-300">
            {safeNum(reliability, 3)}
          </span>
          <span className="text-sm text-zinc-500 ml-2 font-mono">reliability</span>
        </div>

        <div className="space-y-2">
          {AXES.map((a) => {
            const v = udag[a.key]
            return (
              <div key={a.key}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-300">
                    {a.label} <span className="text-zinc-600">{a.hint}</span>
                  </span>
                  <span className="text-zinc-400">{isNum(v) ? v.toFixed(3) : 'n/a'}</span>
                </div>
                <Progress value={isNum(v) ? Math.min(100, v * 100) : 0} className="h-1" />
                {a.key === 'temporal_u' && temporalDerived && (
                  <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
                    Derived, not measured: {gate} x Diagnostic. There is no video signal for a single image.
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <Explainer kind="udag" live={live} />
      </CardContent>
    </Card>
  )
}
