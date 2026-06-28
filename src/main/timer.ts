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
    dive: { label: 'Dive', duration: 0 } // duration 0 means infinite stopwatch
  }
}

class TimerManager {
  private timeLeft: number = 25 * 60
  private elapsedTime: number = 0
  private isActive: boolean = false
  private mode: 'pomodoro' | 'short_break' | 'dive' = 'pomodoro'
  private label: string = 'General'
  private interval: NodeJS.Timeout | null = null

  public init() {
    this.timeLeft = getModes()[this.mode].duration
    this.elapsedTime = 0
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
      elapsedTime: this.elapsedTime,
      isActive: this.isActive,
      mode: this.mode,
      label: this.label,
      duration: getModes()[this.mode].duration
    }
  }

  public start() {
    if (this.isActive) return
    if (this.mode !== 'dive' && this.timeLeft <= 0) return
    this.isActive = true
    this.broadcastState()

    this.interval = setInterval(() => {
      if (this.mode === 'dive') {
        this.elapsedTime += 1
        this.broadcastState()
      } else {
        this.timeLeft -= 1
        if (this.timeLeft <= 0) {
          this.completeSession()
        } else {
          this.broadcastState()
        }
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

  public stop() {
    // Manually stop the timer and complete the session (used for Dive mode)
    if (this.mode === 'dive') {
      if (this.elapsedTime > 0) {
        this.completeSession()
      } else {
        this.pause()
        this.elapsedTime = 0
        this.broadcastState()
      }
    } else {
      this.pause()
      this.init() // Reset (fallback, though UI doesn't use this for pomodoro)
      this.broadcastState()
    }
  }

  public switchMode(newMode: 'pomodoro' | 'short_break' | 'dive', autoStart = false) {
    this.pause()
    this.mode = newMode
    this.timeLeft = getModes()[newMode].duration
    this.elapsedTime = 0
    this.broadcastState()
    if (autoStart) {
      setTimeout(() => this.start(), 100)
    }
  }

  public reloadSettings() {
    // If not active, update the time left immediately to match new duration
    if (!this.isActive && this.mode !== 'dive') {
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
    
    if (this.mode !== 'dive') {
      this.timeLeft = 0 // ensure zero
    }

    const currentMode = this.mode
    const currentLabel = this.label

    if (currentMode === 'pomodoro' || currentMode === 'dive') {
      const todayStr = this.getTodayStr()
      
      const duration = currentMode === 'dive' ? this.elapsedTime : getModes().pomodoro.duration
      
      // Save to DB via existing db functions
      const { lastInsertRowid } = db.addSession(todayStr, duration, currentMode, currentLabel)
      db.addOrUpdateStreak(todayStr, duration)
      
      const xpEarned = Math.floor(duration / 60)
      db.addXP(xpEarned)

      new Notification({
        title: currentMode === 'dive' ? '🌊 Dive Complete!' : '🍅 Pomodoro Complete!',
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
      
      // For Dive, we probably want to reset elapsed time now that it's complete
      // For Dive, we just want to reset it and stay in Dive mode
      if (currentMode === 'dive') {
         this.elapsedTime = 0
         this.broadcastState()
         return // Don't auto-start breaks for dive mode!
      }

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
