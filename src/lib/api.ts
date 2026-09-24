const BASE = `${import.meta.env.BASE_URL}data`

export interface ModelMeta {
  id: string
  name: string
  category: 'classification' | 'segmentation'
}

export interface ReportData {
  report: Record<string, unknown>
  proof: Record<string, unknown> | null
}

export interface CompareRow {
  id: string
  name: string
  category: 'classification' | 'segmentation'
  trust_score: number | null
  trust_verdict: string | null
  fac_bound: number | null
  l_chain: number | null
  faithfulness_auc: number | null
  ece: number | null
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function fetchModels(): Promise<ModelMeta[]> {
  const data = await fetchJSON<{ models: ModelMeta[] }>(`${BASE}/models.json`)
  return data.models
}

export async function fetchReport(modelId: string): Promise<ReportData> {
  return fetchJSON<ReportData>(`${BASE}/reports/${encodeURIComponent(modelId)}.json`)
}

export async function fetchCompare(): Promise<CompareRow[]> {
  const data = await fetchJSON<{ rows: CompareRow[] }>(`${BASE}/compare.json`)
  return data.rows
}
