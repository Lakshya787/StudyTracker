import { BrowserWindow, Notification } from 'electron'
import * as db from '../db/db'

// Dynamic MODES function
export function getModes() {
  const customPomo = db.getSetting('pomodoro_duration')
  const customBreak = db.getSetting('break_duration')
  const pMins = customPomo ? parseInt(customPomo, 10) : 25
  const bMins = customBreak ? parseInt(customBreak, 10) : 5
  return {
    pomodoro: { label: 'Focus', duration: pMins * 60 },
    short_break: { label: 'Short Break', duration: bMins * 60 },
  }
}

class TimerManager {
  private timeLeft: number = 25 * 60
  private isActive: boolean = false
  private mode: 'pomodoro' | 'short_break' = 'pomodoro'
  private label: string = 'General'
  private interval: NodeJS.Timeout | null = null

  public init() {
    this.timeLeft = getModes()[this.mode].duration
  }

  private windows: Set<BrowserWindow> = new Set()

  public addWindow(win: BrowserWindow) {
    this.windows.add(win)
    win.on('closed', () => this.windows.delete(win))
    this.broadcastState()
  }

  public getState() {
    return {
      timeLeft: this.timeLeft,
      isActive: this.isActive,
      mode: this.mode,
      label: this.label,
      duration: getModes()[this.mode].duration
    }
  }

  public start() {
    if (this.isActive) return
    if (this.timeLeft <= 0) return
    this.isActive = true
    this.broadcastState()

    this.interval = setInterval(() => {
      this.timeLeft -= 1
      if (this.timeLeft <= 0) {
        this.completeSession()
      } else {
        this.broadcastState()
      }
    }, 1000)
  }

  public pause(reason?: string) {
    if (!this.isActive) return
    this.isActive = false
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.broadcastState()

    if (reason === 'idle') {
      new Notification({
        title: 'Timer Auto-Paused ⏸️',
        body: 'We noticed you were away for 5 minutes, so we paused your session.'
      }).show()
    }
  }

  public toggle() {
    if (this.isActive) {
      this.pause()
    } else {
      this.start()
    }
  }

  public switchMode(newMode: 'pomodoro' | 'short_break', autoStart = false) {
    this.pause()
    this.mode = newMode
    this.timeLeft = getModes()[newMode].duration
    this.broadcastState()
    if (autoStart) {
      setTimeout(() => this.start(), 100)
    }
  }

  public reloadSettings() {
    // If not active, update the time left immediately to match new duration
    if (!this.isActive) {
      this.timeLeft = getModes()[this.mode].duration
      this.broadcastState()
    }
  }

  public setLabel(newLabel: string) {
    this.label = newLabel
    this.broadcastState()
  }

  private completeSession() {
    this.pause()
    this.timeLeft = 0 // ensure zero

    const currentMode = this.mode
    const currentLabel = this.label

    if (currentMode === 'pomodoro') {
      const todayStr = this.getTodayStr()
      const duration = getModes().pomodoro.duration
      
      // Save to DB via existing db functions
      const { lastInsertRowid } = db.addSession(todayStr, duration, 'pomodoro', currentLabel)
      db.addOrUpdateStreak(todayStr, duration)
      
      const xpEarned = Math.floor(duration / 60)
      db.addXP(xpEarned)

      // We'll call the global badge check logic from index.ts, so let's emit an event for it
      // For now, let's trigger notification
      new Notification({
        title: '🍅 Pomodoro Complete!',
        body: `${currentLabel} session done. Take a break.`
      }).show()

      // Tell renderer to show MoodPicker
      this.broadcast('session-complete', {
        sessionId: lastInsertRowid,
        mode: currentMode,
        label: currentLabel
      })

      // Auto start break if configured (we can check DB setting)
      const autoStart = db.getSetting('auto_start') === 'true'
      if (autoStart) {
        setTimeout(() => this.switchMode('short_break', true), 1000)
      } else {
        setTimeout(() => this.switchMode('short_break', false), 1000)
      }
    } else {
      new Notification({
        title: '☕ Break over!',
        body: 'Time to get back to work.'
      }).show()

      const autoStart = db.getSetting('auto_start') === 'true'
      if (autoStart) {
        setTimeout(() => this.switchMode('pomodoro', true), 1000)
      } else {
        setTimeout(() => this.switchMode('pomodoro', false), 1000)
      }
    }
  }

  private broadcastState() {
    this.broadcast('timer-tick', this.getState())
  }

  private broadcast(channel: string, payload: any) {
    for (const win of this.windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload)
      }
    }
  }

  private getTodayStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}

export const timerManager = new TimerManager()
