import { useEffect, useState, useMemo } from 'react'
import { Trophy, Zap, Star, TrendingUp, Clock, Calendar, Target, Award } from 'lucide-react'
import { toRoman } from '../../../utils'

// ─── Badge Catalogue ──────────────────────────────────────────────────────────

const INFINITE_BADGES = {
  streak: { title: 'Streak', desc: 'day streak', icon: '🔥', rarity: 'legendary', interval: 7 },
  hours: { title: 'Hours', desc: 'hours studied', icon: '📚', rarity: 'epic', interval: 50 },
  daily_sessions: { title: 'Grinder', desc: 'sessions in a day', icon: '⚙️', rarity: 'rare', interval: 5 },
  xp: { title: 'XP Hunter', desc: 'XP earned', icon: '✨', rarity: 'common', interval: 1000 },
  session_len: { title: 'Deep Work', desc: 'hours single session', icon: '🧠', rarity: 'rare', interval: 1 }
}



const RARITY_STYLES = {
  common:    'border-foreground bg-background text-foreground',
  rare:      'border-foreground bg-tertiary text-foreground',
  epic:      'border-foreground bg-secondary text-foreground',
  legendary: 'border-foreground bg-primary text-primary-foreground',
}

// ─── XP / Level helpers ───────────────────────────────────────────────────────

const XP_PER_LEVEL = 200

function getLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

function getLevelProgress(xp: number) {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL
}

function formatDuration(seconds: number) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getColorClass(seconds: number) {
  if (seconds === 0) return 'bg-muted border-2 border-border'
  if (seconds <= 3600) return 'bg-tertiary border-2 border-foreground'
  if (seconds <= 7200) return 'bg-secondary border-2 border-foreground'
  return 'bg-primary border-2 border-foreground shadow-[1px_1px_0px_var(--color-foreground)]'
}

function getDaysArray() {
  const days: Date[] = []
  const today = new Date()
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d)
  }
  return days
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'text-foreground' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-card border-2 border-foreground p-6 rounded-xl flex flex-col gap-2 shadow-pop hover:-translate-y-1 hover:shadow-pop-hover transition-all group overflow-hidden relative">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-current opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500 flex items-end justify-start p-4" style={{ color: color === 'text-foreground' ? 'var(--color-primary)' : 'currentColor' }}>
        <Icon className="w-10 h-10 text-foreground opacity-50 -rotate-12" />
      </div>
      <div className="flex items-center gap-2 text-foreground text-xs font-extrabold uppercase tracking-widest relative z-10">
        <Icon className="w-4 h-4 stroke-[2.5px]" />
        {label}
      </div>
      <div className={`text-4xl font-heading font-extrabold relative z-10 ${color}`}>{value}</div>
      {sub && <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider relative z-10">{sub}</div>}
    </div>
  )
}

function InfiniteBadgeCard({ type, tier, earned }: { type: keyof typeof INFINITE_BADGES; tier: number; earned: boolean }) {
  const def = INFINITE_BADGES[type]
  if (!def) return null
  const requiredValue = def.interval * tier
  return (
    <div className={`border-2 rounded-xl p-5 flex flex-col items-center gap-3 text-center transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-foreground)]
      ${earned ? RARITY_STYLES[def.rarity as keyof typeof RARITY_STYLES] + ' shadow-pop-sm' : 'border-border bg-background opacity-50 grayscale hover:grayscale-0'}`}>
      <div className="text-4xl drop-shadow-md hover:scale-110 transition-transform">{def.icon}</div>
      <div className="text-sm font-extrabold uppercase tracking-widest leading-tight">
        {def.title} {toRoman(tier)}
      </div>
      <div className="text-xs font-bold opacity-80 leading-tight">{requiredValue} {def.desc}</div>
      {earned && (
        <div className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border-2 mt-auto ${RARITY_STYLES[def.rarity as keyof typeof RARITY_STYLES]}`}>
          {def.rarity}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Streaks() {
  const [streakRecords, setStreakRecords] = useState<any[]>([])
  const [xp, setXp] = useState(0)
  const [badges, setBadges] = useState<any[]>([])
  const [bests, setBests] = useState<any>(null)

  useEffect(() => {
    async function load() {
      // @ts-ignore
      setStreakRecords(await window.api.db.getStreaks())
      // @ts-ignore
      setXp(await window.api.db.getXP())
      // @ts-ignore
      setBadges(await window.api.db.getBadges())
      // @ts-ignore
      setBests(await window.api.db.getPersonalBests())
    }
    load()
  }, [])

  const { days, currentStreak, longestStreak, totalHours } = useMemo(() => {
    const recordMap = new Map<string, number>()
    streakRecords.forEach(r => recordMap.set(r.date, r.total_seconds))
    const daysArray = getDaysArray()

    // Current streak
    let current = 0
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
    const todayStr = formatDate(today)
    const yesterdayStr = formatDate(yesterday)

    if ((recordMap.get(todayStr) ?? 0) > 0) {
      let d = new Date()
      while ((recordMap.get(formatDate(d)) ?? 0) > 0) { current++; d.setDate(d.getDate()-1) }
    } else if ((recordMap.get(yesterdayStr) ?? 0) > 0) {
      let d = new Date(yesterday)
      while ((recordMap.get(formatDate(d)) ?? 0) > 0) { current++; d.setDate(d.getDate()-1) }
    }

    // Longest streak
    let longest = 0
    if (streakRecords.length > 0) {
      const sorted = [...streakRecords].filter(r => r.total_seconds > 0).map(r => r.date).sort((a,b) => b.localeCompare(a))
      let run = 1, maxRun = 1
      for (let i = 0; i < sorted.length - 1; i++) {
        const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i+1]).getTime()) / 86400000
        if (diff === 1) { run++; if (run > maxRun) maxRun = run } else if (diff > 1) run = 1
      }
      longest = maxRun
    }

    const totalSecs = streakRecords.reduce((a, r) => a + r.total_seconds, 0)
    return {
      days: daysArray.map(d => ({ date: formatDate(d), seconds: recordMap.get(formatDate(d)) ?? 0 })),
      currentStreak: current,
      longestStreak: longest,
      totalHours: (totalSecs / 3600).toFixed(1),
    }
  }, [streakRecords])

  const weeks: any[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i+7))

  const level = getLevel(xp)
  const levelProgress = getLevelProgress(xp)
  const xpInLevel = xp % XP_PER_LEVEL
  const highestTiers = useMemo(() => {
    const tiers = { streak: 0, hours: 0, daily_sessions: 0, xp: 0, session_len: 0 }
    badges.forEach(b => {
      const parts = b.key.split('_tier_')
      if (parts.length === 2) {
        const type = parts[0] as keyof typeof tiers
        const tier = parseInt(parts[1], 10)
        if (tiers[type] !== undefined && tier > tiers[type]) {
          tiers[type] = tier
        }
      }
    })
    return tiers
  }, [badges])
  
  return (
    <div className="space-y-12 max-w-6xl relative pb-12">

      <header className="border-b-4 border-foreground pb-6">
        <h2 className="text-5xl font-extrabold tracking-tight text-foreground relative z-10">Streaks & Progress</h2>
        <p className="text-muted-foreground mt-4 text-lg font-medium tracking-wide">Consistency builds empires. XP tracks the proof.</p>
      </header>

      {/* ── XP & Level ── */}
      <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary opacity-10 rounded-full" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-tertiary border-4 border-foreground flex items-center justify-center shadow-[4px_4px_0px_var(--color-foreground)]">
              <Star className="w-8 h-8 text-foreground fill-foreground" />
            </div>
            <div>
              <div className="text-xs text-foreground uppercase tracking-widest font-extrabold">Level</div>
              <div className="text-5xl font-heading font-extrabold text-foreground">{level}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-foreground uppercase tracking-widest font-extrabold mb-1">Total XP</div>
            <div className="text-4xl font-heading font-extrabold text-primary text-shadow-sm">{xp.toLocaleString()}</div>
          </div>
        </div>
        <div className="space-y-2 relative z-10 mt-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-foreground">
            <span>{xpInLevel} XP in this level</span>
            <span>{XP_PER_LEVEL - xpInLevel} XP to Level {level + 1}</span>
          </div>
          <div className="h-6 bg-background border-2 border-foreground rounded-full overflow-hidden p-1 shadow-[inset_2px_2px_0px_var(--color-border)]">
            <div
              className="h-full rounded-full bg-primary border-r-2 border-foreground transition-all duration-1000 shadow-[2px_0px_0px_var(--color-foreground)]"
              style={{ width: `${Math.max(levelProgress * 100, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Streak stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Zap}       label="Current Streak"  value={`${currentStreak}d`} sub="consecutive days" color="text-primary" />
        <StatCard icon={TrendingUp} label="Longest Streak" value={`${longestStreak}d`} sub="all-time best" />
        <StatCard icon={Clock}     label="Total Focus"     value={`${totalHours}h`} sub="all sessions" />
        <StatCard icon={Trophy}    label="Badges Earned"   value={badges.length} sub={`Infinite`} color="text-amber-400" />
      </div>

      {/* ── Personal Bests ── */}
      {bests && (
        <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop relative overflow-hidden">
          <div className="absolute left-0 top-0 w-32 h-32 bg-dot-pattern opacity-50 -z-10" />
          <h3 className="text-lg font-extrabold text-foreground uppercase tracking-widest mb-6 flex items-center gap-3">
            <Award className="w-6 h-6 stroke-[2.5px] text-tertiary" /> Personal Bests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 p-5 bg-background border-2 border-foreground rounded-xl shadow-pop-sm hover:-translate-y-1 transition-transform">
              <div className="text-xs text-foreground uppercase tracking-widest font-extrabold">Longest Session</div>
              <div className="text-4xl font-heading font-extrabold text-primary">{formatDuration(bests.longestSessionSeconds)}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">single pomodoro block</div>
            </div>
            <div className="flex flex-col gap-2 p-5 bg-background border-2 border-foreground rounded-xl shadow-pop-sm hover:-translate-y-1 transition-transform">
              <div className="text-xs text-foreground uppercase tracking-widest font-extrabold">Best Day</div>
              <div className="text-4xl font-heading font-extrabold text-secondary">{formatDuration(bests.bestDaySeconds)}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{bests.bestDayDate ?? 'no data yet'}</div>
            </div>
            <div className="flex flex-col gap-2 p-5 bg-background border-2 border-foreground rounded-xl shadow-pop-sm hover:-translate-y-1 transition-transform">
              <div className="text-xs text-foreground uppercase tracking-widest font-extrabold">Total Sessions</div>
              <div className="text-4xl font-heading font-extrabold text-tertiary">{bests.totalSessions}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">pomodoros completed</div>
            </div>
            <div className="flex flex-col gap-2 p-5 bg-background border-2 border-foreground rounded-xl shadow-pop-sm hover:-translate-y-1 transition-transform">
              <div className="text-xs text-foreground uppercase tracking-widest font-extrabold">Total Focus Time</div>
              <div className="text-4xl font-heading font-extrabold text-quaternary">{formatDuration(bests.totalSeconds)}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">lifetime hours studied</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Badges ── */}
      <div className="bg-card border-4 border-foreground rounded-2xl p-8 shadow-pop relative overflow-hidden">
        <h3 className="text-lg font-extrabold text-foreground uppercase tracking-widest mb-6 flex items-center gap-3">
          <Target className="w-6 h-6 stroke-[2.5px] text-primary" /> Milestone Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
          {(Object.keys(INFINITE_BADGES) as Array<keyof typeof INFINITE_BADGES>).map(type => {
            const currentTier = highestTiers[type] || 0
            const cards: any[] = []
            
            for (let i = 1; i <= currentTier; i++) {
              cards.push(<InfiniteBadgeCard key={`${type}_${i}`} type={type} tier={i} earned={true} />)
            }
            
            cards.push(<InfiniteBadgeCard key={`${type}_${currentTier + 1}`} type={type} tier={currentTier + 1} earned={false} />)

            return cards
          }).flat()}
        </div>
      </div>

      {/* ── Contribution Grid ── */}
      <div className="bg-card border-4 border-foreground p-8 rounded-2xl shadow-pop overflow-x-auto relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-64 h-full bg-dot-pattern opacity-50 -z-10" />
        <h3 className="text-lg text-foreground font-extrabold mb-8 uppercase tracking-widest flex items-center gap-3">
          <Calendar className="w-6 h-6 stroke-[2.5px] text-secondary" /> Activity — Last 52 Weeks
        </h3>
        <div className="flex gap-2 min-w-max bg-background p-4 border-2 border-foreground rounded-xl shadow-pop-sm">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-2">
              {week.map(day => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.seconds ? (day.seconds/3600).toFixed(1)+'h' : 'no study'}`}
                  className={`w-4 h-4 rounded-full transition-transform hover:scale-125 hover:ring-2 ring-foreground cursor-crosshair ${getColorClass(day.seconds)}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-6 text-xs font-extrabold uppercase tracking-widest text-foreground justify-end min-w-max bg-background border-2 border-foreground rounded-xl px-4 py-2 self-end w-fit ml-auto">
          <span>Less</span>
          <div className="w-4 h-4 rounded-full bg-muted border-2 border-border" />
          <div className="w-4 h-4 rounded-full bg-tertiary border-2 border-foreground" />
          <div className="w-4 h-4 rounded-full bg-secondary border-2 border-foreground" />
          <div className="w-4 h-4 rounded-full bg-primary border-2 border-foreground" />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
