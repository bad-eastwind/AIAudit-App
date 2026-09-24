import { BarChart3 } from 'lucide-react'
import { ModelSelector } from '@/components/models/ModelSelector'

interface NavbarProps {
  activeModel: string | null
  setActiveModel: (id: string) => void
  setView: (v: 'detail' | 'compare') => void
}

export function Navbar({ activeModel, setActiveModel, setView }: NavbarProps) {
  return (
    <header className="fixed top-0 w-full z-50 h-14 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      {/* Animated gradient glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px animate-gradient-shift"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.6), rgba(139,92,246,0.6), transparent)',
        }}
      />

      <div className="flex items-center justify-between h-full px-6">
        {/* Left: wordmark */}
        <button
          onClick={() => setView('detail')}
          className="font-mono font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          AIAudit
        </button>

        {/* Center: model selector */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <ModelSelector value={activeModel} onChange={(id) => { setActiveModel(id); setView('detail') }} />
        </div>

        {/* Right: compare button */}
        <button
          onClick={() => setView('compare')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700 hover:border-zinc-600"
        >
          <BarChart3 className="w-4 h-4" />
          Compare All
        </button>
      </div>
    </header>
  )
}
