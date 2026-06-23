import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { timerManager } from '../src/main/timer'

vi.mock('../src/db/db', () => ({
  getSetting: vi.fn((key) => {
    if (key === 'pomodoro_duration') return '25'
    if (key === 'break_duration') return '5'
    return null
  }),
  addSession: vi.fn().mockReturnValue({ lastInsertRowid: 1 }),
  addOrUpdateStreak: vi.fn(),
  addXP: vi.fn(),
}))

describe('TimerManager Backend Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    timerManager.init()
    // Reset to focus mode
    timerManager.switchMode('pomodoro', false)
  })

  afterEach(() => {
    timerManager.pause()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('initializes with correct defaults', () => {
    const state = timerManager.getState()
    expect(state.isActive).toBe(false)
    expect(state.mode).toBe('pomodoro')
    expect(state.timeLeft).toBeGreaterThan(0) // Default 25 min or from DB mock
  })

  it('starts and ticks down', () => {
    timerManager.start()
    const initialState = timerManager.getState()
    expect(initialState.isActive).toBe(true)

    // Advance 5 seconds
    vi.advanceTimersByTime(5000)
    
    const newState = timerManager.getState()
    expect(newState.timeLeft).toBe(initialState.timeLeft - 5)
  })

  it('pauses correctly', () => {
    timerManager.start()
    vi.advanceTimersByTime(5000)
    timerManager.pause()
    
    const stateWhenPaused = timerManager.getState()
    expect(stateWhenPaused.isActive).toBe(false)

    // Advance more time, should not tick
    vi.advanceTimersByTime(5000)
    expect(timerManager.getState().timeLeft).toBe(stateWhenPaused.timeLeft)
  })

  it('switches modes', () => {
    timerManager.switchMode('short_break', false)
    const state = timerManager.getState()
    expect(state.mode).toBe('short_break')
    expect(state.isActive).toBe(false) // Didn't autostart
  })
})
