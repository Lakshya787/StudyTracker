import { useEffect, useState } from 'react'
import { BarChart2, X } from 'lucide-react'

const MOODS: Record<number, string> = { 1: '😫', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' }

function formatDuration(seconds: number) {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function todayKey() {
  const d = new Date()
  return `eod_dismissed_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function EndOfDaySummary() {
  const [summary, setSummary] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function check() {
      const hour = new Date().getHours()
      if (hour < 18) return // Only show from 6PM

      const dismissed = localStorage.getItem(todayKey())
      if (dismissed) return

      // @ts-ignore
      const data = await window.api.db.getTodaySummary()
      if (data.sessionCount === 0) return // Nothing to summarize

      setSummary(data)
      setVisible(true)
    }

    // Check immediately and every 30 min
    check()
    const t = setInterval(check, 30 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  const handleClose = () => {
    localStorage.setItem(todayKey(), '1')
    setVisible(false)
  }

  if (!visible || !summary) return null

  const avgMood = summary.sessions
    .filter((s: any) => s.mood != null)
    .reduce((a: number, s: any, _: number, arr: any[]) => a + s.mood / arr.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-80 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">End-of-Day Summary</span>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-5 space-y-4">
          <div className="flex items-end gap-3">
            <div className="text-5xl font-bold text-primary">{formatDuration(summary.totalSeconds)}</div>
            <div className="text-sm text-muted-foreground pb-1">studied today</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Sessions</div>
              <div className="text-2xl font-bold">{summary.sessionCount}</div>
            </div>
            {avgMood > 0 && (
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Avg Mood</div>
                <div className="text-2xl">{MOODS[Math.round(avgMood)]}</div>
              </div>
            )}
          </div>

          {/* Session list */}
          <div className="space-y-1.5">
            {summary.sessions.map((s: any, i: number) => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground/60 font-mono w-4">{i + 1}.</span>
                <span className="text-primary font-semibold">{formatDuration(s.duration_seconds)}</span>
                <span className="text-muted-foreground flex-1 truncate">{s.label || 'General'}</span>
                {s.mood && <span>{MOODS[s.mood]}</span>}
                <span className="text-muted-foreground/50">{formatTime(s.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleClose}
            className="w-full py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Great work — see you tomorrow 👋
          </button>
        </div>
      </div>
    </div>
  )
}
