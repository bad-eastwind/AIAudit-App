import { useState, useEffect } from 'react'
import { fetchCompare, type CompareRow } from '@/lib/api'

export function useCompare() {
  const [rows, setRows] = useState<CompareRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchCompare()
      .then((data) => {
        if (!cancelled) {
          setRows(data)
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
  }, [])

  return { rows, loading, error }
}
