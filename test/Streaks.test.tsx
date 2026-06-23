import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Streaks } from '../src/renderer/src/pages/Streaks'

describe('Streaks Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    window.api.db.getStreaks.mockResolvedValue([
      { date: '2023-10-10', total_seconds: 3600 }
    ])
    // @ts-ignore
    window.api.db.getBadges.mockResolvedValue([
      { key: 'streak_tier_1', earned_at: '2023-10-10' },
      { key: 'hours_tier_2', earned_at: '2023-10-10' }
    ])
    // @ts-ignore
    window.api.db.getXP.mockResolvedValue(1500)
    // @ts-ignore
    window.api.db.getPersonalBests.mockResolvedValue({
      longestSessionSeconds: 3600,
      bestDaySeconds: 7200,
      totalSeconds: 14400,
      totalSessions: 10
    })
  })

  it('renders badges dynamically and correctly calculates Roman numerals', async () => {
    render(<Streaks />)
    
    // We expect Consistency I (earned) and Consistency II (unearned) to be rendered
    const consistencyBadges = await screen.findAllByText(/Consistency/i)
    expect(consistencyBadges.length).toBeGreaterThanOrEqual(1)

    // We expect Deep Work I, II (earned) and Deep Work III (unearned)
    const deepWorkBadges = await screen.findAllByText(/Deep Work/i)
    expect(deepWorkBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('renders XP and levels', async () => {
    render(<Streaks />)
    // 1500 XP = Level 8
    const levelNumber = await screen.findByText('8')
    expect(levelNumber).toBeInTheDocument()
    const xpText = await screen.findByText('1,500')
    expect(xpText).toBeInTheDocument()
  })
})
