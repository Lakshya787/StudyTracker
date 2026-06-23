import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Timer } from '../src/renderer/src/pages/Timer'

describe('Timer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the window.api mock for consistency
    // @ts-ignore
    window.api.timer.getState.mockResolvedValue({
      timeLeft: 1500,
      isActive: false,
      mode: 'pomodoro',
      label: 'General',
      duration: 1500
    })
    // Force existence
    // @ts-ignore
    window.api.timer.onSessionComplete = vi.fn()
    // @ts-ignore
    window.api.timer.onTick = vi.fn()
  })

  it('renders correctly with default state', async () => {
    render(<Timer />)
    // The state is initialized synchronously
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('toggles timer when big play button is clicked', async () => {
    render(<Timer />)
    const toggleBtn = screen.getByText('Start')
    fireEvent.click(toggleBtn)
    
    // @ts-ignore
    expect(window.api.timer.toggle).toHaveBeenCalledTimes(1)
  })

  it('changes label when typing in the input', async () => {
    render(<Timer />)
    const input = screen.getByDisplayValue('General')
    
    fireEvent.change(input, { target: { value: 'Math Study' } })
    
    // @ts-ignore
    expect(window.api.timer.setLabel).toHaveBeenCalledWith('Math Study')
    expect(input).toHaveValue('Math Study')
  })

  it('changes mode when tabs are clicked', async () => {
    render(<Timer />)
    const breakTab = screen.getByText('Short Break')
    fireEvent.click(breakTab)
    
    // @ts-ignore
    expect(window.api.timer.switchMode).toHaveBeenCalledWith('short_break', false)
  })
})
