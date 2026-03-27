import { describe, it, expect } from 'vitest'
import { evaluateFormula, parseCellRef, formatCellRef } from '@/lib/formula/parser'

const mockCell = (refs: Record<string, number | string>) => {
  return (ref: { col: number; row: number }) => {
    const key = formatCellRef(ref)
    return refs[key] ?? null
  }
}

describe('parseCellRef', () => {
  it('parses A1', () => {
    expect(parseCellRef('A1')).toEqual({ col: 1, row: 1 })
  })

  it('parses B10', () => {
    expect(parseCellRef('B10')).toEqual({ col: 2, row: 10 })
  })

  it('parses AA100', () => {
    expect(parseCellRef('AA100')).toEqual({ col: 27, row: 100 })
  })

  it('returns null for invalid refs', () => {
    expect(parseCellRef('123')).toBeNull()
    expect(parseCellRef('')).toBeNull()
  })
})

describe('formatCellRef', () => {
  it('formats (1,1) as A1', () => {
    expect(formatCellRef({ col: 1, row: 1 })).toBe('A1')
  })

  it('formats (2,10) as B10', () => {
    expect(formatCellRef({ col: 2, row: 10 })).toBe('B10')
  })

  it('formats (27,1) as AA1', () => {
    expect(formatCellRef({ col: 27, row: 1 })).toBe('AA1')
  })
})

describe('evaluateFormula', () => {
  describe('literals', () => {
    it('returns number for numeric strings', () => {
      expect(evaluateFormula('42', mockCell({}))).toEqual({ value: 42 })
    })

    it('returns string for text', () => {
      expect(evaluateFormula('hello', mockCell({}))).toEqual({ value: 'hello' })
    })

    it('returns empty string for empty input', () => {
      expect(evaluateFormula('', mockCell({}))).toEqual({ value: '' })
    })
  })

  describe('basic arithmetic', () => {
    it('adds numbers', () => {
      expect(evaluateFormula('=1+2', mockCell({}))).toEqual({ value: 3 })
    })

    it('subtracts numbers', () => {
      expect(evaluateFormula('=10-3', mockCell({}))).toEqual({ value: 7 })
    })

    it('multiplies numbers', () => {
      expect(evaluateFormula('=6*7', mockCell({}))).toEqual({ value: 42 })
    })

    it('divides numbers', () => {
      expect(evaluateFormula('=10/4', mockCell({}))).toEqual({ value: 2.5 })
    })

    it('handles operator precedence', () => {
      expect(evaluateFormula('=2+3*4', mockCell({}))).toEqual({ value: 14 })
    })

    it('handles parentheses', () => {
      expect(evaluateFormula('=(2+3)*4', mockCell({}))).toEqual({ value: 20 })
    })

    it('handles power', () => {
      expect(evaluateFormula('=2^10', mockCell({}))).toEqual({ value: 1024 })
    })
  })

  describe('cell references', () => {
    it('resolves cell reference', () => {
      expect(evaluateFormula('=A1', mockCell({ A1: 42 }))).toEqual({ value: 42 })
    })

    it('computes with cell references', () => {
      const cells = { A1: 10, B1: 20 }
      expect(evaluateFormula('=A1+B1', mockCell(cells))).toEqual({ value: 30 })
    })
  })

  describe('functions', () => {
    it('SUM', () => {
      const cells = { A1: 1, A2: 2, A3: 3 }
      expect(evaluateFormula('=SUM(A1,A2,A3)', mockCell(cells))).toEqual({ value: 6 })
    })

    it('AVERAGE', () => {
      const cells = { A1: 10, A2: 20, A3: 30 }
      expect(evaluateFormula('=AVERAGE(A1,A2,A3)', mockCell(cells))).toEqual({ value: 20 })
    })

    it('MIN', () => {
      const cells = { A1: 5, A2: 2, A3: 8 }
      expect(evaluateFormula('=MIN(A1,A2,A3)', mockCell(cells))).toEqual({ value: 2 })
    })

    it('MAX', () => {
      const cells = { A1: 5, A2: 2, A3: 8 }
      expect(evaluateFormula('=MAX(A1,A2,A3)', mockCell(cells))).toEqual({ value: 8 })
    })

    it('COUNT', () => {
      expect(evaluateFormula('=COUNT(1,2,3)', mockCell({}))).toEqual({ value: 3 })
    })

    it('IF true', () => {
      expect(evaluateFormula('=IF(1>0,"yes","no")', mockCell({}))).toEqual({ value: 'yes' })
    })

    it('IF false', () => {
      expect(evaluateFormula('=IF(0>1,"yes","no")', mockCell({}))).toEqual({ value: 'no' })
    })

    it('CONCATENATE', () => {
      expect(evaluateFormula('=CONCATENATE("hello"," ","world")', mockCell({}))).toEqual({ value: 'hello world' })
    })

    it('UPPER', () => {
      expect(evaluateFormula('=UPPER("hello")', mockCell({}))).toEqual({ value: 'HELLO' })
    })

    it('LEN', () => {
      expect(evaluateFormula('=LEN("hello")', mockCell({}))).toEqual({ value: 5 })
    })

    it('ABS', () => {
      expect(evaluateFormula('=ABS(-5)', mockCell({}))).toEqual({ value: 5 })
    })

    it('ROUND', () => {
      expect(evaluateFormula('=ROUND(3.14159,2)', mockCell({}))).toEqual({ value: 3.14 })
    })

    it('SQRT', () => {
      expect(evaluateFormula('=SQRT(16)', mockCell({}))).toEqual({ value: 4 })
    })
  })

  describe('string concatenation', () => {
    it('concatenates with &', () => {
      expect(evaluateFormula('="hello" & " " & "world"', mockCell({}))).toEqual({ value: 'hello world' })
    })
  })

  describe('comparison', () => {
    it('equals', () => {
      expect(evaluateFormula('=1=1', mockCell({}))).toEqual({ value: true })
    })

    it('not equals', () => {
      expect(evaluateFormula('=1<>2', mockCell({}))).toEqual({ value: true })
    })

    it('less than', () => {
      expect(evaluateFormula('=1<2', mockCell({}))).toEqual({ value: true })
    })
  })

  describe('errors', () => {
    it('handles division by zero gracefully', () => {
      const result = evaluateFormula('=10/0', mockCell({}))
      expect(result.value).toBe(0)
    })

    it('handles unknown functions gracefully', () => {
      const result = evaluateFormula('=UNKNOWN(1)', mockCell({}))
      // Unknown identifiers are treated as strings
      expect(result.value).toBeTruthy()
    })
  })
})
