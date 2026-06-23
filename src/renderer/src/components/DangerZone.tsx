import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function DangerZone() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function check() {
      const hour = new Date().getHours()
      if (hour < 18 || dismissed) return // Only show from 6 PM

      // @ts-ignore
      const sessions: any[] = await window.api.db.getSessions()
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
      const studiedToday = sessions.some(s => s.date === todayStr && s.type === 'pomodoro')

      if (!studiedToday) setShow(true)
    }

    check()
    // Re-check every 15 minutes
    const interval = setInterval(check, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dismissed])

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-8 right-8 z-50 max-w-sm w-full">
      <div className="bg-destructive border-4 border-foreground rounded-2xl p-5 shadow-pop flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-6 h-6 text-destructive-foreground stroke-[3px] animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-heading font-extrabold text-destructive-foreground uppercase tracking-widest">Danger Zone</p>
          <p className="text-sm font-bold text-destructive-foreground/90 mt-1 leading-snug">
            It's past 6 PM and you haven't studied today. Don't break your streak — even one Pomodoro counts.
          </p>
          <button
            onClick={() => {
              setDismissed(true)
              setShow(false)
            }}
            className="mt-3 text-xs font-extrabold uppercase tracking-widest text-destructive-foreground/80 hover:text-destructive-foreground underline decoration-2 underline-offset-4 transition-colors"
          >
            Dismiss for today
          </button>
        </div>
        <button
          onClick={() => { setDismissed(true); setShow(false) }}
          className="flex-shrink-0 text-destructive-foreground/50 hover:text-destructive-foreground transition-colors p-1 border-2 border-transparent hover:border-destructive-foreground rounded-full"
        >
          <X className="w-5 h-5 stroke-[3px]" />
        </button>
      </div>
    </div>
  )
}
