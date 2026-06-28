import { useEffect, useState, useCallback } from 'react'
import { RotateCcw, Target, Zap, List, Square, Trash2 } from 'lucide-react'
import { MoodPicker } from '../components/MoodPicker'
import { formatTime } from '../../../utils'

const QUICK_LABELS = ['General', 'Math', 'Coding', 'Reading', 'Writing', 'Other']

const MODES = {
  pomodoro: { label: 'Focus', duration: 25 * 60 },
  short_break: { label: 'Short Break', duration: 5 * 60 },
  dive: { label: 'Deep Dive', duration: 0 }
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}



function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function EditableLabel({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) {
  const [val, setVal] = useState(initialValue)
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <input 
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { setEditing(false); onSave(val) }}
        onKeyDown={e => { if(e.key === 'Enter') { setEditing(false); onSave(val) } }}
        className="font-extrabold text-sm uppercase tracking-wider bg-background border-b-2 border-primary outline-none text-foreground w-32"
      />
    )
  }

  return (
    <div 
      onClick={() => setEditing(true)}
      className="font-extrabold text-sm uppercase tracking-wider text-foreground group-hover:text-primary transition-colors cursor-pointer"
      title="Click to edit"
    >
      {val || 'Focus'}
    </div>
  )
}

export function Timer() {
  // Global Timer State (synced from Main Process)
  const [timerState, setTimerState] = useState({
    timeLeft: MODES.pomodoro.duration,
    elapsedTime: 0,
    isActive: false,
    mode: 'pomodoro',
    label: 'General',
    duration: MODES.pomodoro.duration
  })

  // Daily goal & history state
  const [goalHours, setGoalHours] = useState(6)
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [sessions, setSessions] = useState<any[]>([])
  const [autoStart, setAutoStart] = useState(false)

  // MoodPicker state
  const [completedSession, setCompletedSession] = useState<{ sessionId: number, mode: string, label: string } | null>(null)

  // Local label input state to prevent cursor jumping
  const [localLabel, setLocalLabel] = useState('General')

  const loadData = useCallback(async () => {
    // @ts-ignore
    const allSessions: any[] = await window.api.db.getSessions()
    const today = todayStr()
    setSessions(allSessions.filter(s => s.date === today && !s.hidden))
    
    const todaySecs = allSessions
      .filter(s => s.date === today && (s.type === 'pomodoro' || s.type === 'dive'))
      .reduce((acc, s) => acc + s.duration_seconds, 0)
    setTodaySeconds(todaySecs)

    // @ts-ignore
    const savedGoal = await window.api.db.getSetting('daily_goal_hours')
    if (savedGoal) setGoalHours(Number(savedGoal))

    // @ts-ignore
    const savedAutoStart = await window.api.db.getSetting('auto_start')
    if (savedAutoStart) setAutoStart(savedAutoStart === 'true')
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sync Timer State from Main Process
  useEffect(() => {
    // Initial fetch
    // @ts-ignore
    window.api.timer.getState().then(setTimerState)

    // Subscriptions
    // @ts-ignore
    window.api.timer.onTick((state: any) => {
      setTimerState(state)
      // Only sync if we're not actively typing to avoid cursor jumps
      if (document.activeElement?.id !== 'session-label-input') {
        setLocalLabel(state.label)
      }
    })

    // @ts-ignore
    window.api.timer.onSessionComplete(async (payload: any) => {
      loadData() // Refresh history immediately

      // Play sound
      // @ts-ignore
      const soundType = await window.api.db.getSetting('sound') || 'bell'
      if (soundType !== 'none') {
        const a = new Audio(`https://assets.mixkit.co/active_storage/sfx/${soundType === 'bell' ? '2869/2869-preview.mp3' : '2868/2868-preview.mp3'}`)
        a.play().catch(() => {})
      }

      if (payload.mode === 'pomodoro') {
        setCompletedSession(payload)
      }
    })
  }, [loadData])

  // Spacebar toggle — global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        // @ts-ignore
        window.api.timer.toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { timeLeft, elapsedTime = 0, isActive, mode, label, duration } = timerState

  // @ts-ignore
  const switchMode = (m: string) => window.api.timer.switchMode(m, false)
  // @ts-ignore
  const toggleTimer = () => window.api.timer.toggle()
  // @ts-ignore
  const stopDive = () => window.api.timer.stop()
  // @ts-ignore
  const changeLabel = (lbl: string) => window.api.timer.setLabel(lbl)

  const progress = duration > 0 ? 1 - timeLeft / duration : 0

  const goalSeconds = goalHours * 3600
  const goalProgress = Math.min(todaySeconds / goalSeconds, 1)

  const handleAutoStartChange = async (v: boolean) => {
    setAutoStart(v)
    // @ts-ignore
    await window.api.db.setSetting('auto_start', v)
  }

  return (
    <div className="flex gap-8 max-w-6xl relative">
      
      {/* Mood Picker Modal */}
      {completedSession && (
        <MoodPicker 
          sessionId={completedSession.sessionId} 
          label={completedSession.label} 
          onClose={() => {
            setCompletedSession(null)
            loadData() // Reload to see mood in history if needed
          }} 
        />
      )}

      {/* Left: Timer */}
      <div className="flex flex-col items-center gap-8 flex-shrink-0 w-[420px] relative">
        
        {/* Mode tabs */}
        <div className="flex bg-background border-2 border-foreground rounded-full overflow-hidden text-sm w-full p-1 shadow-pop-sm">
          {(Object.keys(MODES) as Array<'pomodoro' | 'short_break' | 'dive'>).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-3 font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${mode === m ? 'bg-primary text-primary-foreground shadow-[inset_0px_0px_0px_2px_#1E293B]' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Label selector */}
        <div className="w-full bg-card p-6 border-2 border-foreground rounded-xl shadow-pop">
          <label htmlFor="session-label-input" className="block text-xs text-foreground mb-3 uppercase tracking-widest font-extrabold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-quaternary inline-block" />
            Session Label
          </label>
          <div className="flex flex-col gap-3">
            <input
              id="session-label-input"
              type="text"
              value={localLabel}
              onChange={(e) => {
                setLocalLabel(e.target.value)
                changeLabel(e.target.value)
              }}
              placeholder="e.g. Studying Physics Chapter 3..."
              className="w-full bg-background border-2 border-foreground rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:shadow-pop-sm focus:outline-none transition-shadow placeholder:text-muted-foreground/50"
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_LABELS.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setLocalLabel(s)
                    changeLabel(s)
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${
                    label === s
                      ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_var(--color-foreground)] -translate-y-0.5'
                      : 'bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_var(--color-border)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clock ring */}
        <div className="relative flex items-center justify-center w-[300px] h-[300px] bg-card rounded-full border-4 border-foreground shadow-pop">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="100" fill="none" stroke="var(--color-background)" strokeWidth="12" />
            <circle
              cx="120" cy="120" r="100"
              fill="none"
              stroke={mode === 'pomodoro' ? 'var(--color-primary)' : mode === 'dive' ? 'var(--color-secondary)' : 'var(--color-quaternary)'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={mode === 'dive' ? (isActive ? (2 * Math.PI * 100) * 0.75 : 0) : (2 * Math.PI * 100) * (1 - progress)}
              className={mode === 'dive' && isActive ? 'animate-spin origin-center' : ''}
              style={{ transition: mode === 'dive' ? 'none' : 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="flex flex-col items-center gap-1 z-10">
            <div className={`text-sm font-extrabold uppercase tracking-widest bg-background px-4 py-1 rounded-full border-2 border-foreground shadow-[2px_2px_0px_var(--color-foreground)] ${mode === 'pomodoro' ? 'text-primary' : mode === 'dive' ? 'text-secondary' : 'text-quaternary'}`}>
              {isActive ? MODES[mode as keyof typeof MODES].label : 'Ready'}
            </div>
            <div className="text-7xl font-heading font-extrabold tracking-tighter text-foreground select-none mt-2">
              {formatTime(mode === 'dive' ? elapsedTime : timeLeft)}
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{label}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-4">
          {mode === 'dive' ? (
            <button
              onClick={stopDive}
              className="p-4 bg-background border-2 border-foreground rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground hover:-translate-y-1 hover:shadow-pop-sm transition-all duration-300"
              title="Stop & Save Dive"
            >
              <Square className="w-5 h-5 stroke-[2.5px]" />
            </button>
          ) : (
            <button
              onClick={() => switchMode(mode)}
              className="p-4 bg-background border-2 border-foreground rounded-full text-foreground hover:-translate-y-1 hover:shadow-pop-sm transition-all duration-300"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5px]" />
            </button>
          )}
          <button
            onClick={toggleTimer}
            className={`px-12 py-4 font-bold tracking-widest uppercase text-base rounded-full border-2 border-foreground transition-all duration-300 ${
              isActive
                ? 'bg-destructive text-destructive-foreground shadow-pop hover:-translate-y-1 hover:shadow-pop-hover active:translate-y-1 active:shadow-pop-active'
                : 'bg-primary text-primary-foreground shadow-pop hover:-translate-y-1 hover:shadow-pop-hover active:translate-y-1 active:shadow-pop-active'
            }`}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            // @ts-ignore
            onClick={() => window.api.timer.toggleMiniWidget()}
            className="p-4 bg-background border-2 border-foreground rounded-full text-foreground hover:-translate-y-1 hover:shadow-pop-sm transition-all duration-300 hover:bg-tertiary"
            title="Open Mini Widget"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mt-2">
          Press <kbd className="bg-background border-2 border-foreground px-2 py-0.5 rounded-md text-xs shadow-[1px_1px_0px_#1E293B]">Space</kbd> to toggle
        </p>

        {/* Settings */}
        <div className="w-full bg-card border-2 border-foreground rounded-xl p-6 shadow-pop">
          {/* Daily Goal */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest">
                <Target className="w-4 h-4 text-primary stroke-[2.5px]" />
                <span>Daily Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold bg-background px-3 py-1 rounded-full border-2 border-foreground shadow-[2px_2px_0px_var(--color-foreground)]">{goalHours} hrs</span>
              </div>
            </div>
            <div className="h-4 bg-background border-2 border-foreground rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${goalProgress * 100}%`,
                  background: goalProgress >= 1 ? 'var(--color-quaternary)' : 'var(--color-primary)'
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mt-3">
              <span>{formatDuration(todaySeconds)} done</span>
              <span>
                {Math.max(0, goalSeconds - todaySeconds) === 0
                  ? 'Goal Met! 🎉'
                  : `${formatDuration(Math.max(0, goalSeconds - todaySeconds))} left`}
              </span>
            </div>
          </div>
          {/* Auto Start */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t-2 border-border">
            <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-foreground">
              <Zap className="w-4 h-4 text-tertiary stroke-[2.5px]" />
              <span>Auto-start Pomodoros</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={autoStart} onChange={e => handleAutoStartChange(e.target.checked)} />
              <div className="w-11 h-6 bg-background border-2 border-foreground peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-foreground after:border-foreground after:border-2 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tertiary shadow-[2px_2px_0px_var(--color-foreground)]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Right: History Log */}
      <div className="flex-1 flex flex-col bg-card border-2 border-foreground rounded-xl shadow-pop overflow-hidden h-full">
        <div className="p-6 border-b-2 border-foreground bg-background">
          <h3 className="text-lg font-heading font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
            <List className="w-5 h-5 text-secondary stroke-[2.5px]" />
            Today's Log
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground mt-10 font-bold uppercase tracking-widest text-sm">No sessions yet today.</div>
          ) : (
            sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background border-2 border-border hover:border-foreground rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pop-sm group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${s.type === 'pomodoro' ? 'bg-primary' : s.type === 'dive' ? 'bg-secondary' : 'bg-quaternary'}`} />
                  <div>
                    <EditableLabel 
                      initialValue={s.label} 
                      onSave={async (newVal) => {
                        // @ts-ignore
                        await window.api.db.updateSessionLabel(s.id, newVal)
                        loadData()
                      }} 
                    />
                    <div className="text-xs text-muted-foreground font-bold mt-0.5">
                      {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {s.mood && <span className="text-2xl" title={`Mood: ${s.mood}`}>{s.mood}</span>}
                  <div className="font-mono text-sm bg-muted px-2 py-1 rounded-md border-2 border-border font-bold">
                    {formatDuration(s.duration_seconds)}
                  </div>
                  <button 
                    onClick={async () => {
                      // @ts-ignore
                      await window.api.db.hideSession(s.id)
                      loadData()
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all opacity-0 group-hover:opacity-100"
                    title="Hide session (time won't be deducted)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
