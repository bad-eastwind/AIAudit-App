import { motion } from 'framer-motion'
import { useCompare } from '@/hooks/useCompare'
import { RadarView } from '@/components/compare/RadarView'
import { CompareTable } from '@/components/compare/CompareTable'
import { Skeleton } from '@/components/ui/skeleton'

export function ComparePage() {
  const { rows, loading, error } = useCompare()

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-400 font-mono text-sm">[ERROR] {error}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-mono font-bold text-zinc-100 mb-1">Model Comparison</h1>
        <p className="text-sm text-zinc-500 font-mono">{rows.length} models audited</p>
      </div>

      <RadarView rows={rows} />
      <CompareTable rows={rows} />
    </motion.div>
  )
}
