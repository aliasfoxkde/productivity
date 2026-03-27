import { describe, it, expect } from 'vitest'
import { cn, generateId, formatDate, debounce } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const hidden = false
    expect(cn('base', hidden && 'hidden', 'visible')).toBe('base visible')
  })

  it('deduplicates', () => {
    expect(cn('px-2', 'px-4')).toContain('px-4')
  })
})

describe('generateId', () => {
  it('generates a UUID v4 string', () => {
    const id = generateId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('generates unique IDs', () => {
    const a = generateId()
    const b = generateId()
    expect(a).not.toBe(b)
  })
})

describe('formatDate', () => {
  it('returns "Just now" for very recent dates', () => {
    const now = new Date().toISOString()
    expect(formatDate(now)).toBe('Just now')
  })

  it('returns minutes ago', () => {
    const twoMinAgo = new Date(Date.now() - 120_000).toISOString()
    expect(formatDate(twoMinAgo)).toContain('m ago')
  })
})

describe('debounce', () => {
  it('delays execution', async () => {
    let count = 0
    const fn = debounce(() => { count++ }, 50)
    fn()
    fn()
    fn()
    expect(count).toBe(0)
    await new Promise((r) => setTimeout(r, 100))
    expect(count).toBe(1)
  })
})
