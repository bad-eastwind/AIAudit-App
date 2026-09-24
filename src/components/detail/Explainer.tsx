import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { EXPLANATIONS } from '@/lib/explanations'

interface ExplainerProps {
  kind: keyof typeof EXPLANATIONS
  /** Optional sentence built from the live numbers on the card. */
  live?: string | null
}

export function Explainer({ kind, live }: ExplainerProps) {
  const [open, setOpen] = useState(false)
  const e = EXPLANATIONS[kind]

  return (
    <div className="mt-4 border-t border-zinc-800 pt-3">
      {live && (
        <p className="text-xs text-zinc-300 leading-relaxed mb-2">
          <span className="text-zinc-500">This run: </span>
          {live}
        </p>
      )}
      <p className="text-xs text-zinc-400 leading-relaxed">{e.tagline}</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        {open ? 'Hide explanation' : 'Explain this to me'}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-3 text-xs leading-relaxed">
              <Block label="What it does" text={e.what} />
              <Block label="How to read it" text={e.read} />
              <Block label="Why it matters" text={e.why} />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Jargon, translated</div>
                <dl className="space-y-1">
                  {e.terms.map((t) => (
                    <div key={t.term}>
                      <dt className="inline font-mono text-zinc-200">{t.term}</dt>
                      <dd className="inline text-zinc-400"> : {t.plain}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="text-zinc-600 font-mono">Paper: {e.paper}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
      <p className="text-zinc-300">{text}</p>
    </div>
  )
}
