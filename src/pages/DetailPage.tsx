import { motion } from 'framer-motion'
import { useReport } from '@/hooks/useReport'
import { HeroCards } from '@/components/detail/HeroCards'
import { FaithfulnessPanel } from '@/components/detail/FaithfulnessPanel'
import { ProofPanel } from '@/components/detail/ProofPanel'
import { ClosureBar } from '@/components/detail/ClosureBar'
import { FailureAlert } from '@/components/detail/FailureAlert'
import { CrossCheck } from '@/components/detail/CrossCheck'
import { Skeleton } from '@/components/ui/skeleton'

interface DetailPageProps {
  modelId: string | null
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <span className="text-2xl font-mono font-bold text-zinc-600">?</span>
      </div>
      <h2 className="text-xl font-mono font-semibold text-zinc-300 mb-2">No model selected</h2>
      <p className="text-sm text-zinc-500 font-mono max-w-sm">
        Select a model from the dropdown in the navbar to view its audit report.
      </p>
    </div>
  )
}

export function DetailPage({ modelId }: DetailPageProps) {
  const { data, loading, error } = useReport(modelId)

  if (!modelId) return <EmptyState />

  if (loading) return <LoadingState />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-red-400 font-mono text-sm">[ERROR] {error}</p>
      </div>
    )
  }

  if (!data) return <EmptyState />

  const { report, proof } = data
  const faithfulness = report.faithfulness as Record<string, unknown> | null
  const closure = report.closure as Record<string, unknown> | null
  const failureReasons = Array.isArray(report.failure_reasons)
    ? (report.failure_reasons as string[])
    : []
  const task = typeof report.task === 'string' ? report.task : 'classification'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Model title */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-mono font-bold text-zinc-100">
          {modelId.replace(/_/g, ' ')}
        </h1>
        <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 font-mono">
          {task}
        </div>
      </div>

      {/* Row 1: Hero cards */}
      <HeroCards report={report} />

      <CrossCheck report={report} proof={proof} modelName={modelId.replace(/_/g, ' ')} />

      {/* Failure alert */}
      <FailureAlert failureReasons={failureReasons} category={task} />

      {/* Row 2: Two columns - Faithfulness + Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {faithfulness && <FaithfulnessPanel faithfulness={faithfulness} modelName={modelId.replace(/_/g, ' ')} />}
        {proof && <ProofPanel proof={proof} modelName={modelId.replace(/_/g, ' ')} />}
      </div>

      {/* Row 3: Closure per-stage bar */}
      {closure && Array.isArray(closure.per_stage) && (closure.per_stage as unknown[]).length > 0 && (
        <ClosureBar closure={closure} modelName={modelId.replace(/_/g, " ")} />
      )}
    </motion.div>
  )
}
