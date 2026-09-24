import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Level, MetricReading } from './metricGuide'

export const LEVEL_STYLE: Record<Level, { dot: string; text: string; label: string }> = {
  good: { dot: 'bg-emerald-400', text: 'text-emerald-300', label: 'good' },
  ok: { dot: 'bg-sky-400', text: 'text-sky-300', label: 'fair' },
  warn: { dot: 'bg-amber-400', text: 'text-amber-300', label: 'caution' },
  bad: { dot: 'bg-red-400', text: 'text-red-300', label: 'poor' },
  na: { dot: 'bg-zinc-600', text: 'text-zinc-400', label: 'n/a' },
}

export function MetricRow({ m }: { m: MetricReading }) {
  const [open, setOpen] = useState(false)
  const s = LEVEL_STYLE[m.level]

  return (
    <div className="py-3 border-b border-zinc-800 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} aria-hidden />
          <span className="text-xs font-mono text-zinc-300 truncate">{m.name}</span>
          <span className={`text-[10px] uppercase tracking-wider ${s.text}`}>{s.label}</span>
        </div>
        <span className="text-sm font-mono font-semibold tabular-nums text-zinc-100 flex-shrink-0">{m.value}</span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed mt-1.5 pl-4">{m.forModel}</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-1.5 ml-4 flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        {open ? 'Hide' : 'What is this? How do I read it?'}
      </button>

      {open && (
        <div className="mt-2 ml-4 space-y-1.5 rounded-md bg-zinc-800/60 p-3 text-xs leading-relaxed">
          <p>
            <span className="text-zinc-500">Measures: </span>
            <span className="text-zinc-300">{m.what}</span>
          </p>
          <p>
            <span className="text-zinc-500">Scale: </span>
            <span className="text-zinc-300">{m.scale}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export function BottomLine({ level, text, title }: { level: Level; text: string; title: string }) {
  const s = LEVEL_STYLE[level]
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">{title}</span>
      </div>
      <p className="text-xs text-zinc-200 leading-relaxed">{text}</p>
    </div>
  )
}
