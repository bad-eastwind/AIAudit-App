import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { safeNum, formatVerdict, verdictBg, categoryBg, trustColor } from '@/lib/formatters'
import type { CompareRow } from '@/lib/api'

interface CompareTableProps {
  rows: CompareRow[]
}

type SortKey = keyof CompareRow
type SortDir = 'asc' | 'desc'

export function CompareTable({ rows }: CompareTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('trust_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av
    }
    const as = String(av)
    const bs = String(bv)
    return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
  })

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-400" />
      : <ArrowDown className="w-3 h-3 ml-1 text-indigo-400" />
  }

  function SortHeader({ label, column }: { label: string; column: SortKey }) {
    return (
      <button
        className="flex items-center text-xs font-medium text-zinc-400 uppercase tracking-wider hover:text-zinc-200 transition-colors"
        onClick={() => handleSort(column)}
      >
        {label}
        <SortIcon column={column} />
      </button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Model Comparison Table
        </CardTitle>
        <p className="text-xs text-zinc-500 font-mono mt-0.5">Click column headers to sort</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-zinc-800">
              <TableHead><SortHeader label="Model" column="name" /></TableHead>
              <TableHead><SortHeader label="Category" column="category" /></TableHead>
              <TableHead><SortHeader label="Trust" column="trust_score" /></TableHead>
              <TableHead><SortHeader label="FAC Bound" column="fac_bound" /></TableHead>
              <TableHead><SortHeader label="L_chain" column="l_chain" /></TableHead>
              <TableHead><SortHeader label="Faith AUC" column="faithfulness_auc" /></TableHead>
              <TableHead><SortHeader label="ECE" column="ece" /></TableHead>
              <TableHead>Verdict</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50"
              >
                <TableCell className="font-mono text-sm text-zinc-200 font-medium">
                  {row.name}
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${categoryBg(row.category)}`}>
                    {row.category}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: trustColor(row.trust_score) }}
                    />
                    <span className="font-mono text-sm tabular-nums text-zinc-100">
                      {safeNum(row.trust_score, 3)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm tabular-nums text-zinc-300">
                  {safeNum(row.fac_bound, 3)}
                </TableCell>
                <TableCell className="font-mono text-sm tabular-nums text-zinc-300">
                  {safeNum(row.l_chain, 3)}
                </TableCell>
                <TableCell className="font-mono text-sm tabular-nums text-zinc-300">
                  {safeNum(row.faithfulness_auc, 3)}
                </TableCell>
                <TableCell className="font-mono text-sm tabular-nums text-zinc-300">
                  {safeNum(row.ece, 4)}
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${verdictBg(row.trust_verdict)}`}>
                    {formatVerdict(row.trust_verdict)}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
