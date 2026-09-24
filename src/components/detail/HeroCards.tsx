import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Info } from 'lucide-react'
import { Explainer } from './Explainer'
import { UdagCard, hasUdag } from './UdagCard'
import { formatVerdict, verdictBg, safeNum, pct, trustColor } from '@/lib/formatters'

interface HeroCardsProps {
  report: Record<string, unknown>
}

function TrustRing({ score, verdict }: { score: number | null; verdict: string | null }) {
  const r = 54
  const cx = 72
  const cy = 72
  const circumference = 2 * Math.PI * r
  const clampedScore = Math.max(0, Math.min(1, score ?? 0))
  const dashOffset = circumference * (1 - clampedScore)
  const color = trustColor(score)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 144 144" className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#27272a"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-mono font-bold tabular-nums"
            style={{ color }}
          >
            {score !== null && score !== undefined ? (score * 100).toFixed(0) : 'N/A'}
          </span>
          {score !== null && <span className="text-xs text-zinc-500 font-mono">/100</span>}
        </div>
      </div>
      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${verdictBg(verdict)}`}>
        {formatVerdict(verdict)}
      </div>
    </div>
  )
}

export function HeroCards({ report }: HeroCardsProps) {
  const trustScore = typeof report.trust_score === 'number' ? report.trust_score : null
  const trustVerdict = typeof report.trust_verdict === 'string' ? report.trust_verdict : null

  const facCert = report.fac_certificate as Record<string, unknown> | null
  const acsResult = report.acs_result as Record<string, unknown> | null
  const closure = report.closure as Record<string, unknown> | null
  const udag = hasUdag(report.udag) ? (report.udag as Record<string, unknown>) : null

  const liveTrust =
    trustScore === null
      ? null
      : `${(trustScore * 100).toFixed(0)}/100, so the audit says: ${formatVerdict(trustVerdict).toLowerCase()}.`
  const facBound = typeof facCert?.bound === 'number' ? facCert.bound : null
  const liveFac =
    facBound === null
      ? null
      : `at least ${(facBound * 100).toFixed(1)}% of new cases should have the true answer inside the prediction set.`
  const acsVacuous =
    !!acsResult &&
    ((typeof acsResult.mean_set_fraction === 'number' && acsResult.mean_set_fraction >= 0.99) ||
      (typeof acsResult.q_hat === 'number' && acsResult.q_hat >= 0.999))
  const liveAcs = !acsResult
    ? null
    : acsVacuous
      ? 'the region grew to cover the whole image, so the coverage promise holds but tells you nothing about where the model looked. Calibration needs more or better data.'
      : `the important region was captured ${pct(acsResult.coverage_achieved)} of the time, using ${pct(acsResult.mean_set_fraction)} of the image.`
  const liveClosure =
    typeof closure?.global_lipschitz !== 'number'
      ? null
      : closure.global_passes
        ? 'small input changes cause small audit changes. The audit is stable.'
        : 'small input changes can swing the audit. Treat its verdict with care.'

  const cards = [
    { key: 'trust' },
    { key: 'fac' },
    { key: 'acs' },
    ...(udag ? [{ key: 'udag' }] : []),
    { key: 'closure' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        >
          {card.key === 'trust' && (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Trust Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-6">
                <TrustRing score={trustScore} verdict={trustVerdict} />
                <div className="w-full"><Explainer kind="trust" live={liveTrust} /></div>
              </CardContent>
            </Card>
          )}

          {card.key === 'fac' && (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  N1: FAC Bound
                </CardTitle>
                <p className="text-xs text-zinc-500 font-mono mt-1">Faithfulness-Aware Conformal</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-4xl font-mono font-bold tabular-nums text-indigo-300">
                    {safeNum(facCert?.bound, 3)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">Coverage &gt;= 1 - alpha - 2 * skew</p>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500">skew </span>
                    <span className="text-zinc-200">{safeNum(facCert?.weight_skew, 5)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">n_calib </span>
                    <span className="text-zinc-200">
                      {typeof facCert?.n_calib === 'number' ? facCert.n_calib.toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
                {facCert?.note !== undefined && facCert?.note !== null && (
                  <div className="mt-3">
                    <Badge variant={facCert.note === 'valid' ? 'success' : 'warning'} className="text-xs">
                      {String(facCert.note)}
                    </Badge>
                  </div>
                )}
                <Explainer kind="fac" live={liveFac} />
              </CardContent>
            </Card>
          )}

          {card.key === 'acs' && (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  N2: ACS
                </CardTitle>
                <p className="text-xs text-zinc-500 font-mono mt-1">Attribution Conformal Set</p>
              </CardHeader>
              <CardContent>
                {!acsResult ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      ACS requires a segmentation model with ground-truth masks for calibration.
                    </p>
                    <Badge variant="secondary" className="w-fit text-xs">Not calibrated</Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-4xl font-mono font-bold tabular-nums text-violet-300">
                        {safeNum(acsResult.q_hat, 3)}
                      </span>
                      <span className="text-sm text-zinc-500 ml-2 font-mono">q_hat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={acsVacuous ? 'warning' : 'success'} className="text-xs">
                        Coverage {pct(acsResult.coverage_achieved)}
                        {acsVacuous ? ' (vacuous: whole image)' : ''}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1 font-mono">
                        <span>mean set fraction</span>
                        <span>{pct(acsResult.mean_set_fraction)}</span>
                      </div>
                      <Progress
                        value={
                          typeof acsResult.mean_set_fraction === 'number'
                            ? acsResult.mean_set_fraction * 100
                            : 0
                        }
                        className="h-1"
                      />
                    </div>
                  </div>
                )}
                <Explainer kind="acs" live={liveAcs} />
              </CardContent>
            </Card>
          )}

          {card.key === 'udag' && udag && <UdagCard udag={udag} />}

          {card.key === 'closure' && (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  N4: Closure L_chain
                </CardTitle>
                <p className="text-xs text-zinc-500 font-mono mt-1">Audit Pipeline Lipschitz</p>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <span className="text-4xl font-mono font-bold tabular-nums text-amber-300">
                    {safeNum(closure?.global_lipschitz, 3)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {closure?.global_passes ? (
                    <Badge variant="success" className="text-xs">[PASS] stable</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">[FAIL] unstable</Badge>
                  )}
                  <span className="text-xs text-zinc-500 font-mono">
                    tol={safeNum(closure?.global_tolerance, 1)}
                  </span>
                </div>
                {closure?.stability_statement !== undefined && closure?.stability_statement !== null && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        <Info className="w-3 h-3" />
                        <span>Stability statement</span>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 text-xs text-zinc-300 leading-relaxed font-mono">
                      {String(closure.stability_statement)}
                    </HoverCardContent>
                  </HoverCard>
                )}
                <Explainer kind="closure" live={liveClosure} />
              </CardContent>
            </Card>
          )}
        </motion.div>
      ))}
    </div>
  )
}
