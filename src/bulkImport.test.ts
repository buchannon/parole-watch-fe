import { describe, expect, it } from 'vitest'
import { parseTdcjList } from './bulkImport'

describe('parseTdcjList', () => {
  it('parses numbers separated by newlines, commas and spaces', () => {
    const { valid, dropped } = parseTdcjList('00637060, 01234567\n00637061 05678901')
    expect(valid).toEqual(['00637060', '01234567', '00637061', '05678901'])
    expect(dropped).toEqual([])
  })

  it('drops entries that are not exactly 8 digits', () => {
    const { valid, dropped } = parseTdcjList('00637060, 12345, abcdefgh, 123456789, 0063706x')
    expect(valid).toEqual(['00637060'])
    expect(dropped).toEqual(['12345', 'abcdefgh', '123456789', '0063706x'])
  })

  it('deduplicates numbers preserving first-seen order', () => {
    const { valid, dropped } = parseTdcjList('00637060\n00637060, 01234567\n01234567')
    expect(valid).toEqual(['00637060', '01234567'])
    expect(dropped).toEqual(['00637060', '01234567'])
  })

  it('returns empty results for blank or whitespace-only input', () => {
    expect(parseTdcjList('')).toEqual({ valid: [], dropped: [] })
    expect(parseTdcjList('   \n  ')).toEqual({ valid: [], dropped: [] })
  })

  it('handles mixed separators and surrounding whitespace', () => {
    const { valid, dropped } = parseTdcjList(' 00637060 ;\t 01234567,\n00637061 ')
    expect(valid).toEqual(['00637060', '01234567', '00637061'])
    expect(dropped).toEqual([])
  })
})
