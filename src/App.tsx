import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { DetailPage } from '@/pages/DetailPage'
import { ComparePage } from '@/pages/ComparePage'
import { TooltipProvider } from '@/components/ui/tooltip'

type View = 'detail' | 'compare'

export default function App() {
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [view, setView] = useState<View>('detail')

  return (
    <TooltipProvider>
      <div className="bg-zinc-950 min-h-screen">
        <Navbar
          activeModel={activeModel}
          setActiveModel={(id: string) => {
            setActiveModel(id)
            setView('detail')
          }}
          setView={setView}
        />
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {view === 'compare' ? (
              <ComparePage key="compare" />
            ) : (
              <DetailPage key={`detail-${activeModel}`} modelId={activeModel} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </TooltipProvider>
  )
}
