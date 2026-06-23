import { useEffect, useState, useMemo } from 'react'
import { Clock, Zap, Target, CheckSquare } from 'lucide-react'

function formatDate(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}


function formatDuration(seconds: number) {
  if (seconds === 0) return '0 hrs'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function Dashboard() {
  const [streaks, setStreaks] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [todos, setTodos] = useState<any[]>([])

  useEffect(() => {
    // @ts-ignore
    window.api.db.getStreaks().then(setStreaks).catch(console.error)
    // @ts-ignore
    window.api.db.getSessions().then(setSessions).catch(console.error)
    // @ts-ignore
    window.api.db.getTodos().then(setTodos).catch(console.error)
  }, [])

  const {
    todaySeconds,
    currentStreak,
    sessionsToday,
    sessionTypes,
    todosDoneToday,
    miniGridWeeks
  } = useMemo(() => {
    const today = new Date()
    const todayStr = formatDate(today)
    
    // Streaks logic
    const recordMap = new Map<string, number>()
    streaks.forEach(r => recordMap.set(r.date, r.total_seconds))
    
    const todaySeconds = recordMap.get(todayStr) || 0

    let currentStreak = 0
    let yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    let yesterdayStr = formatDate(yesterday)

    if ((recordMap.get(todayStr) || 0) > 0) {
      let d = new Date()
      while ((recordMap.get(formatDate(d)) || 0) > 0) {
        currentStreak++
        d.setDate(d.getDate() - 1)
      }
    } else if ((recordMap.get(yesterdayStr) || 0) > 0) {
      let d = new Date(yesterday)
      while ((recordMap.get(formatDate(d)) || 0) > 0) {
        currentStreak++
        d.setDate(d.getDate() - 1)
      }
    }

    // Sessions today
    const sessionsTodayArr = sessions.filter(s => s.date === todayStr || (s.created_at && s.created_at.startsWith(todayStr)))
    const sessionsToday = sessionsTodayArr.length
    
    const sessionTypesMap = new Map<string, number>()
    sessionsTodayArr.forEach(s => {
      const type = s.type || 'unknown'
      sessionTypesMap.set(type, (sessionTypesMap.get(type) || 0) + 1)
    })
    const sessionTypes = Array.from(sessionTypesMap.entries()).map(([type, count]) => `${count} ${type}`).join(', ')

    // Todos completed today (done === 1 and created today or simple heuristic if missing completed_at)
    const todosDoneToday = todos.filter(t => t.done === 1 && t.created_at.startsWith(todayStr)).length

    // Mini 4-week grid (28 days)
    const days: any[] = []
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dStr = formatDate(d)
      days.push({
        date: dStr,
        seconds: recordMap.get(dStr) || 0
      })
    }
    
    const miniGridWeeks: any[][] = []
    for (let i = 0; i < days.length; i += 7) {
      miniGridWeeks.push(days.slice(i, i + 7))
    }

    return {
      todaySeconds,
      currentStreak,
      sessionsToday,
      sessionTypes: sessionTypes || 'None',
      todosDoneToday,
      miniGridWeeks
    }
  }, [streaks, sessions, todos])

  return (
    <div className="space-y-8 max-w-6xl relative">

      <header className="border-b-4 border-foreground pb-6 relative">
        <h2 className="text-5xl font-extrabold tracking-tight text-foreground relative z-10">
          Command Center
          <svg className="absolute -bottom-2 left-0 w-32 h-3 text-secondary -z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0,10 Q25,20 50,10 T100,10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </h2>
        <p className="text-muted-foreground mt-4 tracking-wide font-medium text-lg">Today's operational metrics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Metric: Today's Focus */}
        <div className="bg-card border-2 border-foreground p-8 rounded-xl flex flex-col justify-center shadow-pop hover:-rotate-1 hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 flex items-end justify-start p-6">
            <Clock className="w-12 h-12 text-foreground opacity-50 -rotate-12" />
          </div>
          <h3 className="text-sm text-foreground font-bold mb-2 uppercase tracking-widest relative z-10">Focus Time Today</h3>
          <div className="text-6xl font-heading font-extrabold text-primary mb-1 text-shadow-sm relative z-10">{formatDuration(todaySeconds)}</div>
        </div>

        {/* Metric: Current Streak */}
        <div className="bg-card border-2 border-foreground p-8 rounded-xl flex flex-col justify-center shadow-pop hover:rotate-1 hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-tertiary rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 flex items-start justify-end p-4">
            <Zap className="w-8 h-8 text-foreground opacity-50 rotate-12" />
          </div>
          <h3 className="text-sm text-foreground font-bold mb-2 uppercase tracking-widest relative z-10">Current Streak</h3>
          <div className="text-6xl font-heading font-extrabold text-tertiary text-shadow-sm relative z-10">{currentStreak} <span className="text-2xl text-foreground font-bold">days</span></div>
        </div>

        {/* Metric: Sessions */}
        <div className="bg-card border-2 border-foreground p-8 rounded-xl flex flex-col justify-center shadow-pop hover:-rotate-1 hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute right-4 bottom-4 w-20 h-20 bg-secondary rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 flex items-center justify-center">
            <Target className="w-8 h-8 text-foreground opacity-50" />
          </div>
          <h3 className="text-sm text-foreground font-bold mb-2 uppercase tracking-widest relative z-10">Sessions Today</h3>
          <div className="text-6xl font-heading font-extrabold text-foreground mb-3 relative z-10">{sessionsToday}</div>
          <div className="text-sm font-bold bg-background inline-flex px-4 py-2 rounded-full border-2 border-foreground self-start shadow-pop-sm relative z-10">
            {sessionTypes}
          </div>
        </div>

        {/* Metric: Todos */}
        <div className="bg-card border-2 border-foreground p-8 rounded-xl flex flex-col justify-center shadow-pop hover:rotate-1 hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
           <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-quaternary rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 flex items-start justify-start p-8">
             <CheckSquare className="w-10 h-10 text-foreground opacity-50 -rotate-12" />
           </div>
          <h3 className="text-sm text-foreground font-bold mb-2 uppercase tracking-widest relative z-10">Tasks Completed</h3>
          <div className="text-6xl font-heading font-extrabold text-quaternary mb-1 text-shadow-sm relative z-10">{todosDoneToday}</div>
          <div className="text-sm font-bold text-muted-foreground mt-2 relative z-10">cleared from the queue today</div>
        </div>
      </div>

      {/* Mini 4-week Grid Preview */}
      <div className="bg-card border-2 border-foreground p-8 rounded-xl flex flex-col md:flex-row items-center gap-8 shadow-pop relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-dot-pattern opacity-50 -z-10" />
        <div>
          <h3 className="text-sm text-foreground font-bold mb-2 uppercase tracking-widest">Last 28 Days</h3>
          <p className="text-sm font-medium text-muted-foreground max-w-xs">A quick overview of your recent consistency.</p>
        </div>
        
        <div className="flex gap-2 min-w-max ml-auto bg-background p-5 border-2 border-foreground rounded-xl shadow-pop-sm">
          {miniGridWeeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-2">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${formatDuration(day.seconds)}`}
                  className={`w-4 h-4 rounded-full transition-transform hover:scale-125 hover:ring-2 ring-foreground cursor-pointer ${day.seconds > 0 ? 'bg-primary' : 'bg-muted border-2 border-border'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
