import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FailureAlertProps {
  failureReasons: string[]
  category?: string
}

const REASON_DESCRIPTIONS: Record<string, string> = {
  acs_not_calibrated:
    'ACS was not calibrated because this is a classification model (no spatial ground-truth mask). ACS requires segmentation masks for object-level coverage.',
}

export function FailureAlert({ failureReasons, category }: FailureAlertProps) {
  if (!failureReasons || failureReasons.length === 0) return null

  const reasons = failureReasons.map((r) => {
    if (r === 'acs_not_calibrated' && category === 'classification') {
      return { key: r, label: r, explanation: REASON_DESCRIPTIONS[r] }
    }
    return { key: r, label: r, explanation: REASON_DESCRIPTIONS[r] ?? null }
  })

  return (
    <Alert variant="warning" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-mono text-sm">Audit Notes ({reasons.length})</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {reasons.map((r) => (
            <li key={r.key} className="text-xs font-mono">
              <span className="text-amber-200 font-semibold">{r.label}</span>
              {r.explanation && (
                <span className="text-amber-400/80 ml-2">- {r.explanation}</span>
              )}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
