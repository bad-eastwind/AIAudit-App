import { useState, useEffect } from 'react'
import { fetchModels, type ModelMeta } from '@/lib/api'

export function useModels() {
  const [models, setModels] = useState<ModelMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchModels()
      .then((data) => {
        if (!cancelled) {
          setModels(data)
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

  return { models, loading, error }
}
