import { useEffect, useState } from 'react'
import { Play, Pause, X, Square } from 'lucide-react'
import { formatTime } from '../../../utils'

const MODES = {
  pomodoro: { label: 'Focus', duration: 25 * 60 },
  short_break: { label: 'Break', duration: 5 * 60 },
}


export function MiniTimer() {
  const [timerState, setTimerState] = useState({
    timeLeft: MODES.pomodoro.duration,
    elapsedTime: 0,
    isActive: false,
    mode: 'pomodoro',
    label: 'General',
    duration: MODES.pomodoro.duration
  })

  useEffect(() => {
    // @ts-ignore
    window.api.timer.getState().then(setTimerState)
    // @ts-ignore
    window.api.timer.onTick(setTimerState)
  }, [])

  const { timeLeft, elapsedTime = 0, isActive, mode, label, duration } = timerState

  const progress = duration > 0 ? 1 - timeLeft / duration : 0
  const circumference = 2 * Math.PI * 18 // r=18
  const strokeDashoffset = circumference * (1 - progress)

  const isFocus = mode === 'pomodoro'

  return (
    <div className="flex items-center justify-between h-screen w-screen px-4 bg-background border-4 border-foreground overflow-hidden select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-3">
        {mode === 'dive' ? (
          <div className="relative flex items-center justify-center w-10 h-10 bg-[#0f172a] rounded-lg overflow-hidden border-2 border-foreground">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-900 opacity-50" />
            <div 
              className="absolute w-4 h-4 bg-secondary border-2 border-foreground rounded-[4px] shadow-sm z-10"
              style={{
                // Bobbing down effect
                transform: `translateY(${(elapsedTime % 20) - 10}px)`,
                transition: 'transform 1s linear'
              }}
            />
            <div className="absolute bottom-0 w-full text-center text-[9px] font-bold text-white z-20 bg-black/40">
              {elapsedTime}m
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-10 h-10">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="none" stroke="var(--color-border)" strokeWidth="4" />
              <circle
                cx="20" cy="20" r="18"
                fill="none"
                stroke={isFocus ? 'var(--color-primary)' : 'var(--color-quaternary)'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className={`text-[10px] font-bold ${isFocus ? 'text-primary' : 'text-quaternary'}`}>
              {isFocus ? '🍅' : '☕'}
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <span className="text-3xl font-heading font-extrabold tracking-tighter leading-none">{formatTime(mode === 'dive' ? elapsedTime : timeLeft)}</span>
          <span className="text-[10px] text-foreground font-bold tracking-widest uppercase truncate max-w-[120px]">
            {mode === 'dive' ? `🌊 Dive • ${label}` : label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {mode === 'dive' && (
          <button
            // @ts-ignore
            onClick={() => window.api.timer.stop()}
            className="p-2 rounded-full border-2 border-transparent hover:border-foreground hover:bg-destructive hover:text-destructive-foreground hover:shadow-pop-sm transition-all text-destructive"
            title="Stop Dive"
          >
            <Square className="w-4 h-4 fill-destructive stroke-[3px]" />
          </button>
        )}
        <button
          // @ts-ignore
          onClick={() => window.api.timer.toggle()}
          className="p-2 rounded-full border-2 border-transparent hover:border-foreground hover:bg-tertiary hover:shadow-pop-sm transition-all text-foreground"
        >
          {isActive ? <Pause className="w-4 h-4 fill-foreground stroke-[3px]" /> : <Play className="w-4 h-4 ml-0.5 fill-foreground stroke-[3px]" />}
        </button>
        <button
          // @ts-ignore
          onClick={() => window.api.timer.toggleMiniWidget()}
          className="p-2 rounded-full border-2 border-transparent hover:border-foreground hover:bg-destructive hover:text-destructive-foreground hover:shadow-pop-sm transition-all text-muted-foreground"
        >
          <X className="w-4 h-4 stroke-[3px]" />
        </button>
      </div>
    </div>
  )
}
