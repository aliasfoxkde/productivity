/**
 * Fast formula parser — supports cell references, basic operators, and functions.
 * MIT-licensed, no external dependencies.
 */

export type CellValue = string | number | boolean | null

export interface CellRef {
  col: number
  row: number
}

export interface FormulaResult {
  value: CellValue
  error?: string
}

// Token types
type TokenType = 'NUMBER' | 'STRING' | 'CELL_REF' | 'RANGE' | 'FUNCTION' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'COLON' | 'EOF'

interface Token {
  type: TokenType
  value: string
}

const OPERATORS = new Set(['+', '-', '*', '/', '^', '=', '<', '>', '<=', '>=', '<>', '&'])
const FUNCTIONS = new Set([
  'SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX', 'COUNTA', 'COUNTBLANK',
  'IF', 'AND', 'OR', 'NOT',
  'CONCATENATE', 'LEFT', 'RIGHT', 'MID', 'LEN', 'UPPER', 'LOWER', 'TRIM',
  'ABS', 'ROUND', 'CEILING', 'FLOOR', 'INT', 'MOD', 'POWER', 'SQRT',
  'VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH',
  'NOW', 'TODAY', 'DATE', 'YEAR', 'MONTH', 'DAY',
  'TRUE', 'FALSE', 'ISBLANK', 'ISERROR', 'ISTEXT', 'ISNUMBER',
])

function colToNumber(col: string): number {
  let result = 0
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64)
  }
  return result
}

function numberToCol(n: number): string {
  let result = ''
  while (n > 0) {
    n--
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

export function parseCellRef(ref: string): CellRef | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i)
  if (!match) return null
  return { col: colToNumber(match[1].toUpperCase()), row: parseInt(match[2], 10) }
}

export function formatCellRef(ref: CellRef): string {
  return numberToCol(ref.col) + ref.row
}

function tokenize(formula: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const s = formula.trim()

  while (i < s.length) {
    const c = s[i]

    // Whitespace
    if (c === ' ' || c === '\t') { i++; continue }

    // String literal
    if (c === '"') {
      let str = ''
      i++
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\' && i + 1 < s.length) { i++; str += s[i] }
        else { str += s[i] }
        i++
      }
      i++ // skip closing quote
      tokens.push({ type: 'STRING', value: str })
      continue
    }

    // Number
    if (/[0-9.]/.test(c)) {
      let num = ''
      while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i]; i++ }
      tokens.push({ type: 'NUMBER', value: num })
      continue
    }

    // Parentheses, comma, colon
    if (c === '(') { tokens.push({ type: 'LPAREN', value: '(' }); i++; continue }
    if (c === ')') { tokens.push({ type: 'RPAREN', value: ')' }); i++; continue }
    if (c === ',') { tokens.push({ type: 'COMMA', value: ',' }); i++; continue }
    if (c === ':') { tokens.push({ type: 'COLON', value: ':' }); i++; continue }

    // Cell reference (e.g., A1, B2, AA100)
    if (/[A-Za-z]/.test(c) && i + 1 < s.length && /[0-9]/.test(s[i + 1])) {
      let ref = ''
      while (i < s.length && /[A-Za-z0-9]/.test(s[i])) { ref += s[i]; i++ }
      const parsed = parseCellRef(ref)
      if (parsed) {
        tokens.push({ type: 'CELL_REF', value: ref.toUpperCase() })
      } else if (FUNCTIONS.has(ref.toUpperCase())) {
        tokens.push({ type: 'FUNCTION', value: ref.toUpperCase() })
      } else {
        tokens.push({ type: 'STRING', value: ref })
      }
      continue
    }

    // Function name or identifier
    if (/[A-Za-z_]/.test(c)) {
      let ident = ''
      while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) { ident += s[i]; i++ }
      if (FUNCTIONS.has(ident.toUpperCase())) {
        tokens.push({ type: 'FUNCTION', value: ident.toUpperCase() })
      } else {
        tokens.push({ type: 'STRING', value: ident })
      }
      continue
    }

    // Multi-char operators
    if (c === '<' && s[i + 1] === '=') { tokens.push({ type: 'OPERATOR', value: '<=' }); i += 2; continue }
    if (c === '>' && s[i + 1] === '=') { tokens.push({ type: 'OPERATOR', value: '>=' }); i += 2; continue }
    if (c === '<' && s[i + 1] === '>') { tokens.push({ type: 'OPERATOR', value: '<>' }); i += 2; continue }

    // Single-char operators
    if (OPERATORS.has(c)) { tokens.push({ type: 'OPERATOR', value: c }); i++; continue }

    throw new Error(`Unexpected character: ${c} at position ${i}`)
  }

  tokens.push({ type: 'EOF', value: '' })
  return tokens
}

type GetCellValue = (ref: CellRef) => CellValue

function evaluate(
  tokens: Token[],
  pos: { i: number },
  getCell: GetCellValue,
): CellValue {
  const peek = () => tokens[pos.i]
  const consume = () => tokens[pos.i++]

  function parsePrimary(): CellValue {
    const tok = peek()

    // Number
    if (tok.type === 'NUMBER') {
      consume()
      return parseFloat(tok.value)
    }

    // String
    if (tok.type === 'STRING') {
      consume()
      return tok.value
    }

    // Cell reference
    if (tok.type === 'CELL_REF') {
      consume()
      const ref = parseCellRef(tok.value)
      return ref ? getCell(ref) : null
    }

    // Parenthesized expression
    if (tok.type === 'LPAREN') {
      consume()
      const val = parseExpression()
      if (peek().type !== 'RPAREN') throw new Error('Expected closing parenthesis')
      consume()
      return val
    }

    // Function call
    if (tok.type === 'FUNCTION') {
      const name = tok.value
      consume()
      if (peek().type !== 'LPAREN') throw new Error(`Expected ( after ${name}`)
      consume()

      const args: CellValue[] = []
      if (peek().type !== 'RPAREN') {
        args.push(parseExpression())
        while (peek().type === 'COMMA') {
          consume()
          args.push(parseExpression())
        }
      }
      if (peek().type !== 'RPAREN') throw new Error(`Expected ) after ${name} arguments`)
      consume()

      return evaluateFunction(name, args, getCell)
    }

    // Unary minus
    if (tok.type === 'OPERATOR' && tok.value === '-') {
      consume()
      const val = parsePrimary()
      return typeof val === 'number' ? -val : 0
    }

    throw new Error(`Unexpected token: ${tok.type} (${tok.value})`)
  }

  function parsePower(): CellValue {
    let left = parsePrimary()
    while (peek().type === 'OPERATOR' && peek().value === '^') {
      consume()
      const right = parsePrimary()
      left = (typeof left === 'number' && typeof right === 'number')
        ? Math.pow(left, right)
        : 0
    }
    return left
  }

  function parseMultiply(): CellValue {
    let left = parsePower()
    while (
      peek().type === 'OPERATOR' &&
      (peek().value === '*' || peek().value === '/')
    ) {
      const op = consume().value
      const right = parsePower()
      if (typeof left === 'number' && typeof right === 'number') {
        left = op === '*' ? left * right : right !== 0 ? left / right : 0
      } else {
        left = 0
      }
    }
    return left
  }

  function parseAdd(): CellValue {
    let left = parseMultiply()
    while (
      peek().type === 'OPERATOR' &&
      (peek().value === '+' || peek().value === '-' || peek().value === '&')
    ) {
      const op = consume().value
      const right = parseMultiply()
      if (op === '&') {
        left = String(left ?? '') + String(right ?? '')
      } else if (typeof left === 'number' && typeof right === 'number') {
        left = op === '+' ? left + right : left - right
      } else if (op === '+' && (typeof left === 'string' || typeof right === 'string')) {
        left = String(left ?? '') + String(right ?? '')
      } else {
        left = 0
      }
    }
    return left
  }

  function parseComparison(): CellValue {
    let left = parseAdd()
    while (
      peek().type === 'OPERATOR' &&
      ['=', '<', '>', '<=', '>=', '<>'].includes(peek().value)
    ) {
      const op = consume().value
      const right = parseAdd()
      switch (op) {
        case '=': left = left === right; break
        case '<': left = typeof left === 'number' && typeof right === 'number' ? left < right : false; break
        case '>': left = typeof left === 'number' && typeof right === 'number' ? left > right : false; break
        case '<=': left = typeof left === 'number' && typeof right === 'number' ? left <= right : false; break
        case '>=': left = typeof left === 'number' && typeof right === 'number' ? left >= right : false; break
        case '<>': left = left !== right; break
      }
    }
    return left
  }

  function parseExpression(): CellValue {
    return parseComparison()
  }

  return parseExpression()
}

function evaluateFunction(name: string, args: CellValue[]): CellValue {
  const nums = () => args.filter((a): a is number => typeof a === 'number')
  const strs = () => args.map((a) => String(a ?? ''))

  switch (name) {
    // Aggregate
    case 'SUM': return nums().reduce((a, b) => a + b, 0)
    case 'AVERAGE': { const n = nums(); return n.length > 0 ? n.reduce((a, b) => a + b, 0) / n.length : 0 }
    case 'COUNT': return nums().length
    case 'MIN': { const n = nums(); return n.length > 0 ? Math.min(...n) : 0 }
    case 'MAX': { const n = nums(); return n.length > 0 ? Math.max(...n) : 0 }
    case 'COUNTA': return args.filter((a) => a !== null && a !== '' && a !== 0).length
    case 'COUNTBLANK': return args.filter((a) => a === null || a === '' || a === undefined).length

    // Logic
    case 'IF': return args[0] ? args[1] : args.length > 2 ? args[2] : false
    case 'AND': return args.every((a) => !!a)
    case 'OR': return args.some((a) => !!a)
    case 'NOT': return !args[0]

    // String
    case 'CONCATENATE': return strs().join('')
    case 'LEFT': return typeof args[0] === 'string' ? args[0].slice(0, args[1] as number) : ''
    case 'RIGHT': return typeof args[0] === 'string' ? args[0].slice(-(args[1] as number)) : ''
    case 'MID': return typeof args[0] === 'string' ? args[0].slice(args[1] as number, (args[1] as number) + (args[2] as number)) : ''
    case 'LEN': return String(args[0] ?? '').length
    case 'UPPER': return String(args[0] ?? '').toUpperCase()
    case 'LOWER': return String(args[0] ?? '').toLowerCase()
    case 'TRIM': return String(args[0] ?? '').trim()

    // Math
    case 'ABS': return Math.abs(args[0] as number)
    case 'ROUND': return Math.round((args[0] as number) * Math.pow(10, args[1] as number)) / Math.pow(10, args[1] as number)
    case 'CEILING': return Math.ceil(args[0] as number)
    case 'FLOOR': return Math.floor(args[0] as number)
    case 'INT': return Math.floor(args[0] as number)
    case 'MOD': return (args[0] as number) % (args[1] as number)
    case 'POWER': return Math.pow(args[0] as number, args[1] as number)
    case 'SQRT': return Math.sqrt(args[0] as number)

    // Date
    case 'NOW': return new Date().toISOString()
    case 'TODAY': return new Date().toISOString().slice(0, 10)
    case 'YEAR': return new Date(String(args[0])).getFullYear()
    case 'MONTH': return new Date(String(args[0])).getMonth() + 1
    case 'DAY': return new Date(String(args[0])).getDate()

    // Boolean
    case 'TRUE': return true
    case 'FALSE': return false

    // Type checks
    case 'ISBLANK': return args[0] === null || args[0] === '' || args[0] === undefined
    case 'ISNUMBER': return typeof args[0] === 'number'
    case 'ISTEXT': return typeof args[0] === 'string'

    default: return null
  }
}

export function evaluateFormula(
  formula: string,
  getCell: GetCellValue,
): FormulaResult {
  try {
    if (!formula.startsWith('=')) {
      // Not a formula — parse as literal
      const num = Number(formula)
      if (!isNaN(num) && formula.trim() !== '') return { value: num }
      return { value: formula }
    }

    const expr = formula.slice(1)
    const tokens = tokenize(expr)
    const pos = { i: 0 }
    const value = evaluate(tokens, pos, getCell)
    return { value }
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
