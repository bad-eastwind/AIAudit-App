import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { readProof } from './metricGuide'
import { BottomLine, MetricRow } from './MetricRow'

interface ProofPanelProps {
  proof: Record<string, unknown>
  modelName: string
}

const TABS = [
  {
    value: 'calibration',
    label: 'Calibration',
    intro: 'When the model says it is 90% sure, is it right 90% of the time?',
  },
  {
    value: 'selective',
    label: 'Selective',
    intro: 'If the model may skip its least confident cases, how much safer does it get?',
  },
  {
    value: 'failure',
    label: 'Failure',
    intro: "Can the model's own confidence warn you before it is wrong?",
  },
] as const

export function ProofPanel({ proof, modelName }: ProofPanelProps) {
  const summary = readProof(proof, modelName)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Proof Suite
        </CardTitle>
        <p className="text-xs text-zinc-500 font-mono mt-0.5">Can you trust the model&apos;s own confidence?</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <BottomLine level={summary.level} title={`What this means for ${modelName}`} text={summary.bottomLine} />

        <Tabs defaultValue="calibration">
          <TabsList className="w-full mb-3">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-1 text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              <p className="text-xs text-zinc-500 italic mb-1">{t.intro}</p>
              {summary[t.value].map((m) => (
                <MetricRow key={m.id} m={m} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
