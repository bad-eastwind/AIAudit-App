// Builds the static JSON the app reads from public/data/.
// Usage: node scripts/build-data.mjs <path-to-audit-outputs>
import fs from 'fs'
import path from 'path'

const src = process.argv[2]
if (!src || !fs.existsSync(src)) {
  console.error('[ERROR] usage: node scripts/build-data.mjs <path-to-audit-outputs>')
  process.exit(1)
}

const out = path.resolve(new URL('../public/data', import.meta.url).pathname)

// Python json.dumps(allow_nan=True) emits bare NaN/Infinity, which is not valid JSON.
function parse(file) {
  const raw = fs.readFileSync(file, 'utf-8')
  return JSON.parse(raw.replace(/:\s*(NaN|-?Infinity)\b/g, ': null'))
}

// Two proof layouts exist: flat, and a nested "proof_suite" block. Emit the flat one.
function normalizeProof(raw) {
  if (!raw) return null
  const suite = raw.proof_suite
  if (!suite) return raw
  const flat = { ...raw }
  delete flat.proof_suite
  const map = [
    ['ece_before_temp', 'ece'],
    ['ece_after_temp', 'ece_after_temp_scaling'],
    ['temperature_T', 'temperature'],
    ['brier_score', 'brier_score'],
  ]
  for (const [from, to] of map) if (typeof suite[from] === 'number') flat[to] = suite[from]
  return flat
}

// Listing comes from these folders (category by folder). When a model has a
// calibrated run, that run is used for its data.
const LISTING = [
  ['class_models', 'classification'],
  ['seg_models', 'segmentation'],
]
const PREFERRED = ['imagenet_calibration', 'class_models', 'seg_models']

function dirFor(id) {
  for (const d of PREFERRED) {
    const p = path.join(src, d, id)
    if (fs.existsSync(path.join(p, 'novel_audit_report.json'))) return p
  }
  return null
}

fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(path.join(out, 'reports'), { recursive: true })

const models = []
const rows = []

for (const [folder, category] of LISTING) {
  const base = path.join(src, folder)
  if (!fs.existsSync(base)) continue
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = dirFor(entry.name)
    if (!dir) continue

    const id = entry.name
    const report = parse(path.join(dir, 'novel_audit_report.json'))
    const proofPath = path.join(dir, 'proof_results.json')
    const proof = normalizeProof(fs.existsSync(proofPath) ? parse(proofPath) : null)

    models.push({ id, name: id.replace(/_/g, ' '), category })
    rows.push({
      id,
      name: id.replace(/_/g, ' '),
      category,
      trust_score: report.trust_score ?? null,
      trust_verdict: report.trust_verdict ?? null,
      fac_bound: report.fac_certificate?.bound ?? null,
      l_chain: report.closure?.global_lipschitz ?? null,
      faithfulness_auc: report.faithfulness?.auc ?? null,
      ece: proof?.ece ?? null,
    })
    fs.writeFileSync(path.join(out, 'reports', `${id}.json`), JSON.stringify({ report, proof }))
  }
}

fs.writeFileSync(path.join(out, 'models.json'), JSON.stringify({ models }))
fs.writeFileSync(path.join(out, 'compare.json'), JSON.stringify({ rows }))
console.log(`[OK] wrote ${models.length} models to ${out}`)
