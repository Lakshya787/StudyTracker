import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DangerZone } from './DangerZone'
import { EyeRestTimer } from './EyeRestTimer'
import { EndOfDaySummary } from './EndOfDaySummary'
import { AnimatePresence, motion } from 'framer-motion'

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-dot-pattern opacity-10" />
      <Sidebar />
      <main className="flex-1 overflow-auto p-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="max-w-6xl mx-auto w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <DangerZone />
      <EyeRestTimer />
      <EndOfDaySummary />
    </div>
  )
}

