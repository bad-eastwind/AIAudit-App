export function formatVerdict(v: string | null | undefined): string {
  if (!v) return 'Unknown'
  const stripped = v.replace(/^TrustVerdict\./i, '')
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase()
}

export function verdictColor(v: string | null | undefined): string {
  if (!v) return 'text-zinc-400'
  const lower = v.toLowerCase().replace(/^trustverdict\./i, '')
  if (lower === 'reliable') return 'text-emerald-400'
  if (lower === 'caution') return 'text-amber-400'
  if (lower === 'flag_for_review' || lower === 'flagged' || lower === 'flag') return 'text-red-400'
  return 'text-zinc-400'
}

export function verdictBg(v: string | null | undefined): string {
  if (!v) return 'bg-zinc-700/30 text-zinc-300 border-zinc-600'
  const lower = v.toLowerCase().replace(/^trustverdict\./i, '')
  if (lower === 'reliable') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (lower === 'caution') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (lower === 'flag_for_review' || lower === 'flagged' || lower === 'flag')
    return 'bg-red-500/15 text-red-300 border-red-500/30'
  return 'bg-zinc-700/30 text-zinc-300 border-zinc-600'
}

export function faithVerdict(v: string | null | undefined): string {
  if (!v) return 'text-zinc-400'
  const lower = v.toLowerCase()
  if (lower === 'faithful') return 'text-emerald-400'
  if (lower === 'decorative') return 'text-red-400'
  if (lower === 'uncertain') return 'text-amber-400'
  return 'text-zinc-400'
}

export function faithVerdictBg(v: string | null | undefined): string {
  if (!v) return 'bg-zinc-700/30 text-zinc-300 border-zinc-600'
  const lower = v.toLowerCase()
  if (lower === 'faithful') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (lower === 'decorative') return 'bg-red-500/15 text-red-300 border-red-500/30'
  if (lower === 'uncertain') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  return 'bg-zinc-700/30 text-zinc-300 border-zinc-600'
}

export function safeNum(v: unknown, decimals = 4): string {
  if (typeof v !== 'number' || !isFinite(v)) return 'N/A'
  return v.toFixed(decimals)
}

export function pct(v: unknown): string {
  if (typeof v !== 'number' || !isFinite(v)) return 'N/A'
  return (v * 100).toFixed(1) + '%'
}

export function trustColor(score: number | null | undefined): string {
  if (score === null || score === undefined || !isFinite(score)) return '#71717a'
  if (score >= 0.7) return '#10b981'
  if (score >= 0.4) return '#f59e0b'
  return '#ef4444'
}

export function categoryBg(cat: string): string {
  if (cat === 'classification') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  if (cat === 'segmentation') return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  return 'bg-zinc-700/30 text-zinc-300 border-zinc-600'
}
