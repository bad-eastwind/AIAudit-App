import { readFaithfulness, readProof, type Level } from './metricGuide'
import { readClosure } from './closureGuide'
import { BottomLine } from './MetricRow'

interface CrossCheckProps {
  report: Record<string, unknown>
  proof: Record<string, unknown> | null
  modelName: string
}

const SEVERITY: Level[] = ['bad', 'warn']

/**
 * Shown when the headline trust verdict is Reliable but a detail card below
 * disagrees. Avoids the page reading as self-contradictory.
 */
export function CrossCheck({ report, proof, modelName }: CrossCheckProps) {
  const verdict = typeof report.trust_verdict === 'string' ? report.trust_verdict.toLowerCase() : ''
  if (!verdict.includes('reliable')) return null

  const concerns: string[] = []
  const fa = report.faithfulness as Record<string, unknown> | null
  if (fa && SEVERITY.includes(readFaithfulness(fa, modelName).level)) concerns.push('Faithfulness (evidence is shaky)')
  if (proof && SEVERITY.includes(readProof(proof, modelName).level)) concerns.push('Proof Suite (confidence is unreliable)')
  const cl = report.closure as Record<string, unknown> | null
  if (cl && SEVERITY.includes(readClosure(cl, modelName).level)) concerns.push('Closure (audit is unstable)')

  if (concerns.length === 0) return null

  return (
    <BottomLine
      level="warn"
      title="Read the cards below before trusting the headline"
      text={
        `The trust score calls ${modelName} reliable, but these sections raise concerns: ${concerns.join('; ')}. ` +
        `The trust score blends a few signals into one number, so it can look healthy while a specific check underneath is weak.`
      }
    />
  )
}
