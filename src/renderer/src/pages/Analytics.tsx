import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDate() { return new Date() }

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(d: Date, offsetWeeks = 0) {
  const date = new Date(d)
  const day = date.getDay() // 0=Sun
  date.setDate(date.getDate() - day - offsetWeeks * 7)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SUBJECT_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4'
]

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border-2 border-foreground px-4 py-3 rounded-xl shadow-pop text-sm font-bold">
      <div className="text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className="text-foreground text-xl font-heading font-extrabold">{payload[0].value.toFixed(1)} hrs</div>
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border-2 border-foreground px-4 py-3 rounded-xl shadow-pop text-sm font-bold">
      <div className="text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name}</div>
      <div className="text-foreground text-xl font-heading font-extrabold">{payload[0].value.toFixed(1)} hrs</div>
    </div>
  )
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop hover:-translate-y-1 transition-transform relative overflow-hidden">
      <div className="absolute right-0 bottom-0 w-32 h-32 bg-dot-pattern opacity-50 -z-10" />
      <h3 className="text-lg font-extrabold text-foreground uppercase tracking-widest mb-6 relative z-10">{title}</h3>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Analytics() {
  const [sessions, setSessions] = useState<any[]>([])
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')

  useEffect(() => {
    // @ts-ignore
    window.api.db.getSessions().then(setSessions).catch(console.error)
  }, [])

  // Build a date→seconds map (pomodoro only)
  const dateMap = useMemo(() => {
    const map = new Map<string, { seconds: number; subjects: Map<string, number> }>()
    sessions
      .filter(s => s.type === 'pomodoro' || s.type === 'dive')
      .forEach(s => {
        const entry = map.get(s.date) ?? { seconds: 0, subjects: new Map() }
        entry.seconds += s.duration_seconds
        const sub = s.label && s.label !== '' ? s.label : 'General'
        entry.subjects.set(sub, (entry.subjects.get(sub) ?? 0) + s.duration_seconds)
        map.set(s.date, entry)
      })
    return map
  }, [sessions])

  // ── 1. Weekly/Monthly Bar Chart ──────────────────────────────────────────────
  const barData = useMemo(() => {
    if (period === 'weekly') {
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const d = addDays(todayDate(), i - 6)
        const dateStr = formatDate(d)
        const hrs = (dateMap.get(dateStr)?.seconds ?? 0) / 3600
        return { label: DAY_LABELS[d.getDay()], hrs, isToday: i === 6 }
      })
    } else {
      // Last 12 months
      const today = todayDate()
      return Array.from({ length: 12 }, (_, i) => {
        const monthOffset = 11 - i
        const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1)
        const year = targetDate.getFullYear()
        const month = targetDate.getMonth()
        let totalSecs = 0
        dateMap.forEach((entry, dateStr) => {
          const d = new Date(dateStr)
          if (d.getFullYear() === year && d.getMonth() === month) {
            totalSecs += entry.seconds
          }
        })
        return {
          label: MONTH_LABELS[month],
          hrs: totalSecs / 3600,
          isToday: month === today.getMonth() && year === today.getFullYear()
        }
      })
    }
  }, [dateMap, period])

  // ── 2. Best Day of Week Heatmap ──────────────────────────────────────────────
  const dowData = useMemo(() => {
    const totals = Array(7).fill(0)
    const counts = Array(7).fill(0)
    dateMap.forEach((entry, dateStr) => {
      const dow = new Date(dateStr).getDay()
      totals[dow] += entry.seconds / 3600
      counts[dow]++
    })
    const max = Math.max(...totals, 0.001)
    return DAY_LABELS.map((label, i) => ({
      label,
      hrs: totals[i],
      avg: counts[i] > 0 ? totals[i] / counts[i] : 0,
      intensity: totals[i] / max
    }))
  }, [dateMap])

  // ── 3. Subject Breakdown Pie ─────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const subjectMap = new Map<string, number>()
    sessions
      .filter(s => s.type === 'pomodoro')
      .forEach(s => {
        const sub = s.label && s.label !== '' ? s.label : 'General'
        subjectMap.set(sub, (subjectMap.get(sub) ?? 0) + s.duration_seconds)
      })
    return Array.from(subjectMap.entries())
      .map(([name, secs]) => ({ name, value: secs / 3600 }))
      .sort((a, b) => b.value - a.value)
  }, [sessions])

  // ── 4. This Week vs Last Week ────────────────────────────────────────────────
  const weekComparison = useMemo(() => {
    const today = todayDate()
    const thisWeekStart = startOfWeek(today)
    const lastWeekStart = startOfWeek(today, 1)

    let thisWeekSecs = 0
    let lastWeekSecs = 0
    for (let i = 0; i < 7; i++) {
      const thisDay = formatDate(addDays(thisWeekStart, i))
      const lastDay = formatDate(addDays(lastWeekStart, i))
      thisWeekSecs += dateMap.get(thisDay)?.seconds ?? 0
      lastWeekSecs += dateMap.get(lastDay)?.seconds ?? 0
    }

    // Only count days elapsed this week (avoid dividing by 0)
    const daysElapsed = Math.max(today.getDay(), 1)
    const thisAvg = thisWeekSecs / daysElapsed / 3600
    const lastAvg = lastWeekSecs / 7 / 3600
    const delta = thisAvg - lastAvg
    const pct = lastAvg > 0 ? ((delta / lastAvg) * 100).toFixed(0) : null

    return { thisAvg, lastAvg, delta, pct }
  }, [dateMap])

  return (
    <div className="space-y-12 max-w-6xl relative">

      <header className="border-b-4 border-foreground pb-6">
        <h2 className="text-5xl font-extrabold tracking-tight text-foreground relative z-10">Analytics</h2>
        <p className="text-muted-foreground mt-4 text-lg font-medium tracking-wide">Data-driven discipline.</p>
      </header>

      {/* ── Row 1: Week vs Last Week + Subject Pie ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* This week vs last week */}
        <Card title="Avg Daily Hours — This Week vs Last">
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">This week</span>
                <span className="font-extrabold text-primary">{weekComparison.thisAvg.toFixed(1)} hrs/day</span>
              </div>
              <div className="h-4 bg-background border-2 border-foreground rounded-full overflow-hidden shadow-[inset_2px_2px_0px_var(--color-border)] p-0.5">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 shadow-[2px_0px_0px_var(--color-foreground)] border-r-2 border-foreground"
                  style={{ width: `${Math.min(weekComparison.thisAvg / 8, 1) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2 font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Last week</span>
                <span className="font-extrabold text-foreground">{weekComparison.lastAvg.toFixed(1)} hrs/day</span>
              </div>
              <div className="h-4 bg-background border-2 border-foreground rounded-full overflow-hidden shadow-[inset_2px_2px_0px_var(--color-border)] p-0.5">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-700 shadow-[2px_0px_0px_var(--color-foreground)] border-r-2 border-foreground"
                  style={{ width: `${Math.min(weekComparison.lastAvg / 8, 1) * 100}%` }}
                />
              </div>
            </div>
            {weekComparison.pct !== null && (
              <div className={`text-sm font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl self-start border-2 border-foreground shadow-[2px_2px_0px_var(--color-foreground)] ${
                weekComparison.delta >= 0
                  ? 'bg-quaternary text-foreground'
                  : 'bg-destructive text-destructive-foreground'
              }`}>
                {weekComparison.delta >= 0 ? '▲' : '▼'} {Math.abs(Number(weekComparison.pct))}% vs last week
              </div>
            )}
            {weekComparison.pct === null && (
              <div className="text-sm font-bold text-muted-foreground bg-muted border-2 border-border px-4 py-2 rounded-xl self-start">No data from last week to compare.</div>
            )}
          </div>
        </Card>

        {/* Subject pie — spans 2 cols */}
        <div className="md:col-span-2">
          <Card title="Subject Breakdown">
            {pieData.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 text-sm">No sessions with labels yet.</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={44}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={SUBJECT_COLORS[idx % SUBJECT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 flex-1">
                  {pieData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-3 text-sm">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-foreground"
                        style={{ background: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }}
                      />
                      <span className="text-foreground font-bold uppercase tracking-widest flex-1 truncate">{entry.name}</span>
                      <span className="text-muted-foreground font-heading font-extrabold text-lg">{entry.value.toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Row 2: Bar Chart ── */}
      <Card title={`Hours Studied — ${period === 'weekly' ? 'Last 7 Days' : 'Last 12 Months'}`}>
        <div className="flex justify-end mb-6">
          <div className="flex bg-background border-2 border-foreground rounded-full p-1 overflow-hidden text-sm shadow-pop-sm">
            {(['weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 font-bold uppercase tracking-widest transition-colors rounded-full ${
                  period === p ? 'bg-primary text-primary-foreground shadow-[inset_0px_0px_0px_2px_#1E293B]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}h`}
              width={30}
              domain={[0, period === 'weekly' ? 24 : 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="hrs" radius={[4, 4, 0, 0]}>
              {barData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.isToday ? 'var(--color-primary)' : 'var(--color-muted)'}
                  opacity={entry.hrs > 0 ? 1 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Best Day of the Week">
        <div className="flex gap-4 items-end">
          {dowData.map((d) => (
            <div key={d.label} className="flex flex-col items-center gap-3 flex-1 group cursor-default">
              <div className="text-sm text-foreground font-heading font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">
                {d.hrs > 0 ? `${d.hrs.toFixed(0)}h` : '—'}
              </div>
              <div
                className="w-full rounded-full transition-all border-2 border-foreground group-hover:scale-105"
                style={{
                  height: `${Math.max(d.intensity * 160, 16)}px`,
                  background: d.intensity > 0 ? 'var(--color-primary)' : 'var(--color-muted)',
                  opacity: d.intensity > 0 ? 0.4 + (d.intensity * 0.6) : 0.5
                }}
                title={`${d.label}: ${d.hrs.toFixed(1)} total hrs, ${d.avg.toFixed(1)} avg/session`}
              />
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{d.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          {(() => {
            const best = dowData.reduce((a, b) => a.hrs > b.hrs ? a : b)
            return best.hrs > 0
              ? `Your most productive day is <strong>${best.label}</strong> with ${best.hrs.toFixed(1)} total hours.`
              : 'Complete some sessions to see your best day.'
          })()}
        </div>
      </Card>
    </div>
  )
}
