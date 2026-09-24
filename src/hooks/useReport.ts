import { useState, useEffect } from 'react'
import { fetchReport, type ReportData } from '@/lib/api'

export function useReport(modelId: string | null) {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!modelId) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchReport(modelId)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err))
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [modelId])

  return { data, loading, error }
}
