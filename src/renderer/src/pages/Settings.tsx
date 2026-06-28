import { useEffect, useState } from 'react'
import { Save, Download, Volume2, Monitor, Clock, Target } from 'lucide-react'

export function Settings() {
  const [settings, setSettings] = useState({
    pomodoro_duration: '25',
    break_duration: '5',
    theme: 'dark',
    sound: 'bell',
    daily_goal_hours: '6'
  })
  
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      // @ts-ignore
      const db = window.api.db
      const pd = await db.getSetting('pomodoro_duration') || '25'
      const bd = await db.getSetting('break_duration') || '5'
      const th = await db.getSetting('theme') || 'dark'
      const sd = await db.getSetting('sound') || 'bell'
      const dg = await db.getSetting('daily_goal_hours') || '6'
      
      setSettings({
        pomodoro_duration: pd,
        break_duration: bd,
        theme: th,
        sound: sd,
        daily_goal_hours: dg
      })
    }
    load()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const saveSettings = async () => {
    // @ts-ignore
    const db = window.api.db
    await db.setSetting('pomodoro_duration', settings.pomodoro_duration)
    await db.setSetting('break_duration', settings.break_duration)
    await db.setSetting('theme', settings.theme)
    await db.setSetting('sound', settings.sound)
    await db.setSetting('daily_goal_hours', settings.daily_goal_hours)
    
    // Apply theme
    document.body.className = `theme-${settings.theme}`
    
    // Reload timer durations in main process
    // @ts-ignore
    await window.api.timer.reloadSettings()

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const exportData = async () => {
    // @ts-ignore
    const success = await window.api.db.exportData()
    if (success) {
      alert('Data exported successfully!')
    }
  }

  const playSound = (soundType: string) => {
    if (soundType === 'none') return
    const a = new Audio(`https://assets.mixkit.co/active_storage/sfx/${soundType === 'bell' ? '2869/2869-preview.mp3' : '2868/2868-preview.mp3'}`)
    a.play().catch(() => {})
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 relative">

      <header className="flex items-end justify-between border-b-4 border-foreground pb-6 mb-8">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground relative z-10">Settings</h1>
          <p className="text-muted-foreground mt-4 text-lg font-medium tracking-wide">Customize your StudyTracker experience.</p>
        </div>
        <button
          onClick={saveSettings}
          className="flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-extrabold uppercase tracking-widest border-2 border-foreground shadow-pop hover:-translate-y-1 hover:shadow-pop-hover active:translate-y-0 active:shadow-none transition-all"
        >
          <Save className="w-5 h-5 stroke-[2.5px]" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      <div className="space-y-8">
        
        {/* Timer Section */}
        <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop relative overflow-hidden">
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-dot-pattern opacity-50 -z-10" />
          <div className="flex items-center gap-3 text-2xl font-heading font-extrabold text-foreground mb-6">
            <Clock className="w-8 h-8 text-primary stroke-[2.5px]" /> Timer Durations
          </div>
          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div>
              <label className="block text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Pomodoro (minutes)</label>
              <input 
                type="number" min={1} max={120} 
                value={settings.pomodoro_duration}
                onChange={e => handleChange('pomodoro_duration', e.target.value)}
                className="w-full bg-background border-2 border-foreground rounded-xl px-5 py-4 text-2xl font-heading font-extrabold text-foreground focus:shadow-pop-sm focus:outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Short Break (minutes)</label>
              <input 
                type="number" min={1} max={60} 
                value={settings.break_duration}
                onChange={e => handleChange('break_duration', e.target.value)}
                className="w-full bg-background border-2 border-foreground rounded-xl px-5 py-4 text-2xl font-heading font-extrabold text-foreground focus:shadow-pop-sm focus:outline-none transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop">
          <div className="flex items-center gap-3 text-2xl font-heading font-extrabold text-foreground mb-6">
            <Target className="w-8 h-8 text-tertiary stroke-[2.5px]" /> Daily Goal
          </div>
          <div>
            <label className="block text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Target Study Hours per Day</label>
            <input 
              type="number" min={1} max={24} 
              value={settings.daily_goal_hours}
              onChange={e => handleChange('daily_goal_hours', e.target.value)}
              className="w-full max-w-xs bg-background border-2 border-foreground rounded-xl px-5 py-4 text-2xl font-heading font-extrabold text-foreground focus:shadow-pop-sm focus:outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop">
          <div className="flex items-center gap-3 text-2xl font-heading font-extrabold text-foreground mb-6">
            <Monitor className="w-8 h-8 text-secondary stroke-[2.5px]" /> Appearance
          </div>
          <div>
            <label className="block text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Theme</label>
            <div className="flex gap-4">
              {['dark', 'light', 'oled'].map(t => (
                <button
                  key={t}
                  onClick={() => handleChange('theme', t)}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest border-2 transition-all hover:-translate-y-1 ${
                    settings.theme === t 
                      ? 'border-foreground bg-primary text-primary-foreground shadow-[4px_4px_0px_var(--color-foreground)]' 
                      : 'border-border bg-background text-muted-foreground hover:border-foreground hover:shadow-pop-sm'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Section */}
        <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop">
          <div className="flex items-center gap-3 text-2xl font-heading font-extrabold text-foreground mb-6">
            <Volume2 className="w-8 h-8 text-quaternary stroke-[2.5px]" /> Audio Alerts
          </div>
          <div>
            <label className="block text-sm font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Session Complete Sound</label>
            <div className="flex gap-4">
              {['bell', 'chime', 'none'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    handleChange('sound', s)
                    playSound(s)
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest border-2 transition-all hover:-translate-y-1 ${
                    settings.sound === s 
                      ? 'border-foreground bg-tertiary text-foreground shadow-[4px_4px_0px_var(--color-foreground)]' 
                      : 'border-border bg-background text-muted-foreground hover:border-foreground hover:shadow-pop-sm'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop">
          <div className="flex items-center gap-3 text-2xl font-heading font-extrabold text-foreground mb-2">
            <Download className="w-8 h-8 text-muted-foreground stroke-[2.5px]" /> Data & Backup
          </div>
          <p className="text-sm font-bold text-muted-foreground mb-6">Export all your sessions, streaks, and todos as a JSON file.</p>
          <button
            onClick={exportData}
            className="w-full flex items-center justify-center gap-3 bg-background border-2 border-foreground hover:bg-muted text-foreground px-6 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-pop-sm active:translate-y-0 active:shadow-none"
          >
            <Download className="w-5 h-5 stroke-[2.5px]" />
            Export Data Backup
          </button>
        </div>

      </div>
    </div>
  )
}
