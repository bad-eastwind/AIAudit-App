// Plain-language reading of the N5 Closure stages for the selected model.
import type { Level } from './metricGuide'

const isNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v)
const g = (v: number) => (v === 0 ? '0' : Math.abs(v) < 0.001 || Math.abs(v) >= 1000 ? v.toExponential(2) : v.toFixed(v < 1 ? 4 : 2))

export interface StageInfo {
  title: string
  /** What the stage is, in plain words. */
  what: string
  /** Unit of the drift the probes measure. */
  driftUnit: string
  /** How to picture one unit of drift. */
  driftMeaning: (d: number) => string
}

export const STAGE_INFO: Record<string, StageInfo> = {
  attribution: {
    title: 'Heatmap (attribution)',
    what: 'The step that draws the heatmap of which pixels drove the prediction.',
    driftUnit: 'size of the change in the heatmap',
    driftMeaning: (d) => `the heatmap changes by about ${g(d)} in size`,
  },
  faithfulness: {
    title: 'Faithfulness score',
    what: 'The step that scrambles the model and scores how much the heatmap depends on it (the AUC from the Faithfulness card).',
    driftUnit: 'change in the faithfulness score (a 0 to 1 scale)',
    driftMeaning: (d) => `the faithfulness score moves by about ${g(d)} on its 0 to 1 scale`,
  },
  conformal: {
    title: 'Prediction set (conformal)',
    what: 'The step that builds the set of possible answers with the coverage promise (N1/N2).',
    driftUnit: 'share of the prediction set that changes (0 = identical set, 1 = completely different)',
    driftMeaning: (d) => `about ${g(d * 100)}% of the prediction set changes`,
  },
  trust: {
    title: 'Trust score',
    what: 'The final step that turns all signals into the trust number.',
    driftUnit: 'change in the trust score (a 0 to 1 scale)',
    driftMeaning: (d) => `the trust score moves by about ${g(d)}`,
  },
}

export interface StageReading {
  stage: string
  title: string
  what: string
  level: Level
  lipschitz: number | null
  tolerance: number | null
  medianDrift: number | null
  p95Drift: number | null
  nProbes: number | null
  share: number | null
  passes: boolean
  /** Every probe gave zero drift: a pass with nothing measured. */
  noMovement: boolean
  forModel: string
  scale: string
}

export interface ClosureReading {
  stages: StageReading[]
  epsilon: number | null
  globalL: number | null
  globalTol: number | null
  globalPasses: boolean
  level: Level
  bottomLine: string
  /** Extra explanation when the global check disagrees with the stage checks. */
  disagreement: string | null
  worstStage: string | null
}

export function readClosure(closure: Record<string, unknown>, model: string): ClosureReading {
  const eps = isNum(closure.epsilon) ? closure.epsilon : null
  const globalL = isNum(closure.global_lipschitz) ? closure.global_lipschitz : null
  const globalTol = isNum(closure.global_tolerance) ? closure.global_tolerance : null
  const globalPasses = closure.global_passes === true

  const raw = Array.isArray(closure.per_stage) ? (closure.per_stage as Record<string, unknown>[]) : []
  const total = raw.reduce((a, s) => a + (isNum(s.lipschitz) ? Math.max(0, s.lipschitz) : 0), 0)

  const stages: StageReading[] = raw.map((s) => {
    const stage = String(s.stage ?? 'stage')
    const info = STAGE_INFO[stage] ?? {
      title: stage,
      what: 'One step of the audit chain.',
      driftUnit: 'change in the stage output',
      driftMeaning: (d: number) => `its output changes by about ${g(d)}`,
    }
    const L = isNum(s.lipschitz) ? s.lipschitz : null
    const tol = isNum(s.tolerance) ? s.tolerance : null
    const med = isNum(s.median_drift) ? s.median_drift : null
    const p95 = isNum(s.p95_drift) ? s.p95_drift : null
    const passes = s.passes === true

    let level: Level = 'na'
    let note = 'No reading for this stage.'
    if (L !== null && tol !== null) {
      const epsTxt = eps !== null ? eps : 0.05
      const nudge = `A nudge of size ${epsTxt} to the input`
      if (L === 0) {
        level = 'ok'
        note =
          `${nudge} changed nothing here: every probe gave zero drift. The stage is steady, or its output is coarse enough that a nudge this small never flips it. ` +
          `With only ${s.n_probes ?? '?'} probes, treat zero as "no movement seen", not proof of perfection.`
      } else if (passes && L <= tol / 2) {
        level = 'good'
        note = `${nudge} moves this stage only a little: ${med !== null ? info.driftMeaning(med) : 'small change'}. Well inside its allowance (L ${g(L)} against ${g(tol)}).`
      } else if (passes) {
        level = 'ok'
        note = `${nudge} moves this stage noticeably (${med !== null ? info.driftMeaning(med) : 'moderate change'}). It still passes, but uses over half of its allowance (L ${g(L)} against ${g(tol)}).`
      } else if (L <= tol * 3) {
        level = 'warn'
        note = `${nudge} moves this stage more than allowed: ${med !== null ? info.driftMeaning(med) : 'large change'}. L ${g(L)} is above its limit of ${g(tol)}.`
      } else {
        level = 'bad'
        note = `${nudge} swings this stage a lot: ${med !== null ? info.driftMeaning(med) : 'very large change'}. L ${g(L)} is ${g(L / tol)} times its limit of ${g(tol)}. Results here can flip on tiny input noise.`
      }
      if (p95 !== null && med !== null && med > 0 && p95 > 2 * med) {
        note += ` The worst probe moved ${g(p95)}, over twice the typical ${g(med)}, so the movement is uneven.`
      }
    }

    return {
      stage,
      title: info.title,
      what: info.what,
      level,
      lipschitz: L,
      tolerance: tol,
      medianDrift: med,
      p95Drift: p95,
      nProbes: isNum(s.n_probes) ? s.n_probes : null,
      share: L !== null && total > 0 ? Math.max(0, L) / total : null,
      passes,
      noMovement: L === 0 && (p95 === null || p95 === 0),
      forModel: note,
      scale: `L (Lipschitz estimate) = typical drift divided by the nudge size. Drift here is the ${info.driftUnit}. Lower is steadier; this stage must stay at or below ${tol !== null ? g(tol) : 'its limit'}.`,
    }
  })

  const failing = stages.filter((s) => !s.passes && s.lipschitz !== null)
  const worst = stages
    .filter((s) => s.lipschitz !== null)
    .sort((a, b) => (b.lipschitz ?? 0) - (a.lipschitz ?? 0))[0]

  let level: Level = 'na'
  let bottomLine = `No closure result for ${model}.`
  let disagreement: string | null = null

  if (stages.length && globalL !== null) {
    const maxDrift = eps !== null ? globalL * eps : null
    if (globalPasses) {
      level = 'good'
      bottomLine =
        `${model}'s audit is stable: a nudge of size ${eps ?? 0.05} to the input can shift the whole audit output by at most about ${maxDrift !== null ? g(maxDrift) : 'a small amount'}. ` +
        `The chain-wide score L is ${g(globalL)}, under the limit of ${globalTol !== null ? g(globalTol) : '1'}.`
    } else {
      level = failing.length >= 2 || globalL > (globalTol ?? 1) * 5 ? 'bad' : 'warn'
      bottomLine =
        `${model}'s audit is not stable enough: chain-wide L is ${g(globalL)} against a limit of ${globalTol !== null ? g(globalTol) : '1'}. ` +
        (worst ? `The main source is the ${worst.title.toLowerCase()} step (${g(((worst.share ?? 0) * 100))}% of the total). ` : '') +
        `Small input noise can change the audit verdict, so read its other cards with caution.`
    }
    const zeroStages = stages.filter((x) => x.lipschitz === 0).length
    if (globalPasses && zeroStages >= 2) {
      level = 'ok'
      bottomLine +=
        ` Caution: ${zeroStages} of ${stages.length} stages showed exactly zero movement. That is often a sign the stage output is flat or constant, ` +
        `so this pass may reflect an insensitive probe rather than real steadiness.`
    }
    if (!globalPasses && failing.length === 0) {
      disagreement =
        `Every stage passes its own limit, yet the chain fails. That is by design: the chain adds the stage sensitivities together and holds the total to a stricter limit (${globalTol !== null ? g(globalTol) : '1'}) than the per-stage limits, because errors from each step stack up.`
    }
  }

  return { stages, epsilon: eps, globalL, globalTol, globalPasses, level, bottomLine, disagreement, worstStage: worst?.stage ?? null }
}
