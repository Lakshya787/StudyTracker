import { describe, it, expect } from 'vitest'
import { toRoman, formatTime } from '../src/utils'

describe('Math Utilities', () => {
  describe('toRoman', () => {
    it('should correctly convert numbers to Roman numerals', () => {
      expect(toRoman(1)).toBe('I')
      expect(toRoman(4)).toBe('IV')
      expect(toRoman(9)).toBe('IX')
      expect(toRoman(14)).toBe('XIV')
      expect(toRoman(50)).toBe('L')
      expect(toRoman(100)).toBe('C')
      expect(toRoman(1994)).toBe('MCMXCIV')
      expect(toRoman(3999)).toBe('MMMCMXCIX')
    })

    it('should return empty string for zero or negative numbers', () => {
      expect(toRoman(0)).toBe('')
      expect(toRoman(-5)).toBe('')
    })
  })

  describe('formatTime', () => {
    it('should format seconds into MM:SS format', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(5)).toBe('00:05')
      expect(formatTime(59)).toBe('00:59')
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(65)).toBe('01:05')
      expect(formatTime(3599)).toBe('59:59')
    })

    it('should handle negative numbers gracefully', () => {
      expect(formatTime(-10)).toBe('00:00')
    })
  })
})
