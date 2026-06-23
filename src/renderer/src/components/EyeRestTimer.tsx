import { useEffect, useState, useRef, useCallback } from 'react'
import { Eye, X } from 'lucide-react'

const EYE_REST_INTERVAL_MS = 20 * 60 * 1000  // 20 minutes
const EYE_REST_DURATION_S  = 20               // 20 seconds

export function EyeRestTimer() {
  const [phase, setPhase] = useState<'idle' | 'reminder'>('idle')
  const [countdown, setCountdown] = useState(EYE_REST_DURATION_S)
  const [enabled, setEnabled] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const startReminder = useCallback(() => {
    setCountdown(EYE_REST_DURATION_S)
    setPhase('reminder')
  }, [])

  const dismiss = useCallback(() => {
    setPhase('idle')
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  // Load preference
  useEffect(() => {
    // @ts-ignore
    window.api.db.getSetting('eye_rest_enabled').then((v: string | null) => {
      if (v !== null) setEnabled(v === 'true')
    }).catch(() => {})
  }, [])

  // Main 20-min interval
  useEffect(() => {
    if (!enabled) return
    intervalRef.current = setInterval(startReminder, EYE_REST_INTERVAL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [enabled, startReminder])

  // Countdown when reminder active
  useEffect(() => {
    if (phase !== 'reminder') return
    setCountdown(EYE_REST_DURATION_S)
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          dismiss()
          return EYE_REST_DURATION_S
        }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [phase, dismiss])

  if (phase !== 'reminder') return null

  const pct = ((EYE_REST_DURATION_S - countdown) / EYE_REST_DURATION_S) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
      <div className="bg-card border-4 border-foreground rounded-2xl p-10 w-96 text-center shadow-pop relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-secondary border-4 border-foreground shadow-[4px_4px_0px_var(--color-foreground)] flex items-center justify-center mx-auto mb-6">
          <Eye className="w-10 h-10 text-foreground stroke-[2.5px]" />
        </div>
        <h3 className="text-3xl font-heading font-extrabold text-foreground mb-3">Eye Rest</h3>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">
          Look at something <span className="text-primary font-extrabold">20 feet away</span> for 20 seconds. Relax your eyes.
        </p>
        <div className="relative w-32 h-32 mx-auto mb-8 bg-background border-4 border-foreground rounded-full shadow-[inset_4px_4px_0px_var(--color-border)] p-2">
          <svg className="w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="transparent" strokeWidth="8" />
            <circle
              cx="48" cy="48" r="40"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-heading font-extrabold text-foreground">{countdown}</span>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-xs font-extrabold uppercase tracking-widest text-foreground bg-background border-2 border-foreground hover:bg-muted rounded-xl px-4 py-2 hover:shadow-[2px_2px_0px_var(--color-foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <X className="w-4 h-4 stroke-[3px]" /> Dismiss
        </button>
      </div>
    </div>
  )
}
