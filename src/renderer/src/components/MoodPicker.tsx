import { useState, useEffect } from 'react'

const MOODS = [
  { value: 1, emoji: '😫', label: 'Exhausted' },
  { value: 2, emoji: '😕', label: 'Distracted' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Focused' },
  { value: 5, emoji: '🤩', label: 'Flow State' },
]

interface Props {
  sessionId: number | null
  label: string
  onClose: () => void
}

export function MoodPicker({ sessionId, label, onClose }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async (mood: number) => {
    if (!sessionId) { onClose(); return }
    setSaving(true)
    // @ts-ignore
    await window.api.db.updateSessionMood(sessionId, mood)
    onClose()
  }

  // Auto-close after 30s with no response
  useEffect(() => {
    const t = setTimeout(onClose, 30000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
      <div className="bg-card border-4 border-foreground rounded-2xl p-10 w-96 shadow-pop text-center relative overflow-hidden">
        <div className="text-6xl mb-4 drop-shadow-md">🍅</div>
        <h3 className="text-3xl font-heading font-extrabold text-foreground mb-2">Session Complete</h3>
        <p className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">
          <span className="text-primary">{label || 'General'}</span>
        </p>
        <p className="text-sm font-bold text-muted-foreground mb-8">How was your focus?</p>

        <div className="flex justify-center gap-2 mb-8 relative z-10">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => setSelected(m.value)}
              className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all border-2 ${
                selected === m.value
                  ? 'border-foreground bg-primary/20 scale-110 shadow-[2px_2px_0px_var(--color-foreground)]'
                  : 'border-transparent hover:bg-muted hover:scale-105 hover:border-foreground hover:shadow-[2px_2px_0px_var(--color-foreground)]'
              }`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-4 relative z-10">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-extrabold uppercase tracking-widest text-foreground bg-background border-2 border-foreground rounded-xl hover:bg-muted hover:shadow-[2px_2px_0px_var(--color-foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            Skip
          </button>
          <button
            onClick={() => selected && handleSave(selected)}
            disabled={!selected || saving}
            className="flex-1 py-3 text-sm font-extrabold uppercase tracking-widest bg-primary text-primary-foreground border-2 border-foreground rounded-xl hover:shadow-[2px_2px_0px_var(--color-foreground)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
