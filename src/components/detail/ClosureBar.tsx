import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { safeNum } from '@/lib/formatters'
import { BottomLine, LEVEL_STYLE } from './MetricRow'
import { readClosure, type StageReading } from './closureGuide'

interface ClosureBarProps {
  closure: Record<string, unknown>
  modelName: string
}

const STAGE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f59e0b']

const fmt = (v: number | null, d = 4) => (v === null ? 'N/A' : safeNum(v, d))

function ToleranceGauge({ value, limit }: { value: number; limit: number }) {
  // limit sits at 2/3 of the track so overshoot stays visible.
  const scale = limit * 1.5
  const fill = Math.min(1, value / scale) * 100
  const over = value > limit
  return (
    <div>
      <div className="relative h-2 rounded bg-zinc-800">
        <div
          className={`absolute inset-y-0 left-0 rounded ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${fill}%` }}
        />
        <div className="absolute inset-y-[-3px] w-px bg-zinc-300" style={{ left: '66.67%' }} />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
        <span>0</span>
        <span>limit {fmt(limit, 1)}</span>
      </div>
    </div>
  )
}

function StageCard({ s, color, epsilon }: { s: StageReading; color: string; epsilon: number | null }) {
  const [open, setOpen] = useState(false)
  const st = LEVEL_STYLE[s.level]

  return (
    <div className="rounded-lg bg-zinc-800/50 border border-zinc-800 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-medium leading-tight">{s.title}</div>
            <div className="text-[10px] font-mono text-zinc-500">stage: {s.stage}</div>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] uppercase tracking-wider text-right ${
            s.noMovement ? 'text-amber-300' : st.text
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.noMovement ? 'bg-amber-400' : st.dot}`} aria-hidden />
          {s.noMovement ? 'pass, nothing measured' : s.passes ? 'pass' : 'fail'}
        </span>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed">{s.what}</p>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-bold tabular-nums text-zinc-100">{fmt(s.lipschitz)}</span>
        <span className="text-xs text-zinc-500 font-mono">L (sensitivity)</span>
        {s.share !== null && (
          <span className="ml-auto text-xs font-mono text-zinc-400">{(s.share * 100).toFixed(0)}% of chain</span>
        )}
      </div>

      {s.lipschitz !== null && s.tolerance !== null && <ToleranceGauge value={s.lipschitz} limit={s.tolerance} />}

      <p className="text-xs text-zinc-300 leading-relaxed">{s.forModel}</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors w-fit"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        {open ? 'Hide' : 'What do these numbers mean?'}
      </button>

      {open && (
        <div className="rounded-md bg-zinc-900/70 p-3 space-y-1.5 text-xs leading-relaxed">
          <p>
            <span className="text-zinc-500">How L is built: </span>
            <span className="text-zinc-300">{s.scale}</span>
          </p>
          <p className="font-mono text-zinc-400">
            typical drift {fmt(s.medianDrift)} / nudge {epsilon ?? 'n/a'} = L {fmt(s.lipschitz)}
          </p>
          <p>
            <span className="text-zinc-500">Worst probe: </span>
            <span className="text-zinc-300 font-mono">{fmt(s.p95Drift)}</span>
            <span className="text-zinc-500"> across </span>
            <span className="text-zinc-300 font-mono">{s.nProbes ?? 'n/a'}</span>
            <span className="text-zinc-500"> random nudges. Few probes means a rough estimate.</span>
          </p>
        </div>
      )}
    </div>
  )
}

export function ClosureBar({ closure, modelName }: ClosureBarProps) {
  const r = readClosure(closure, modelName)
  const [showHow, setShowHow] = useState(false)

  if (r.stages.length === 0) return null

  const total = r.stages.reduce((sum, s) => sum + Math.max(0, s.lipschitz ?? 0), 0) || 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              N4: Closure - Is the audit itself steady?
            </CardTitle>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Nudge the input slightly and watch how far each audit step moves
            </p>
          </div>
          <div className="text-xs font-mono text-zinc-400 text-right flex-shrink-0">
            Chain L = <span className="text-amber-300 font-bold">{safeNum(r.globalL, 3)}</span>
            <div className="text-zinc-600">limit {fmt(r.globalTol, 1)}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <BottomLine level={r.level} title={`What this means for ${modelName}`} text={r.bottomLine} />

        {/* Stacked share bar */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono">
            Where the sensitivity comes from
          </p>
          <div className="relative h-8 rounded-md overflow-hidden flex">
            {r.stages.map((s, i) => {
              const width = ((Math.max(0, s.lipschitz ?? 0) / total) * 100).toFixed(2)
              return (
                <div
                  key={s.stage}
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    width: `${width}%`,
                    backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length],
                    minWidth: width === '0.00' ? '0' : '2px',
                  }}
                  title={`${s.title}: L=${fmt(s.lipschitz)}`}
                >
                  {parseFloat(width) > 12 && (
                    <span className="text-xs font-mono text-white/85 truncate px-1">{s.stage}</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {r.stages.map((s, i) => (
              <span key={s.stage} className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                {s.stage} {fmt(s.lipschitz)}
                {s.noMovement && <span className="text-amber-300">(no drift seen)</span>}
              </span>
            ))}
          </div>
          {r.disagreement && <p className="text-xs text-amber-300/90 leading-relaxed mt-3">{r.disagreement}</p>}
        </div>

        {/* One card per stage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          {r.stages.map((s, i) => (
            <StageCard key={s.stage} s={s} color={STAGE_COLORS[i % STAGE_COLORS.length]} epsilon={r.epsilon} />
          ))}
        </div>

        {/* How closure works */}
        <div className="border-t border-zinc-800 pt-3">
          <button
            type="button"
            onClick={() => setShowHow((o) => !o)}
            aria-expanded={showHow}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showHow ? 'rotate-180' : ''}`} />
            {showHow ? 'Hide' : 'How is this measured, and how far can I trust it?'}
          </button>
          {showHow && (
            <div className="mt-3 space-y-2 text-xs text-zinc-300 leading-relaxed">
              <p>
                <span className="text-zinc-500">Method: </span>
                the audit is re-run on a few randomly nudged copies of the image (nudge size {r.epsilon ?? 'n/a'}). For each step, L = typical output change divided by the nudge size. The chain score adds the steps together, which is a safe upper bound.
              </p>
              <p>
                <span className="text-zinc-500">Reading the promise: </span>
                {closure.stability_statement !== undefined && closure.stability_statement !== null
                  ? String(closure.stability_statement)
                  : 'No stability statement was generated.'}
              </p>
              <p>
                <span className="text-zinc-500">Limits: </span>
                the estimate comes from a handful of random nudges, not a worst-case search, so it is an estimate rather than a proof. A pass means no instability was seen, and a fail is a real warning.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
