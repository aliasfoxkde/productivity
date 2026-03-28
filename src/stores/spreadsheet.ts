import { create } from 'zustand'
import { generateId } from '@/lib/utils'
import { evaluateFormula, type CellValue, type CellRef } from '@/lib/formula/parser'

export interface SpreadsheetCell {
  raw: string
  computed: CellValue
  error?: string
}

interface Sheet {
  id: string
  name: string
  cells: Record<string, SpreadsheetCell>
}

interface SpreadsheetState {
  sheets: Sheet[]
  activeSheetId: string

  getActiveSheet: () => Sheet | undefined
  getCell: (sheetId: string, ref: string) => SpreadsheetCell
  setCell: (ref: string, raw: string) => void
  addSheet: (name?: string) => string
  removeSheet: (id: string) => void
  renameSheet: (id: string, name: string) => void
  setActiveSheet: (id: string) => void
  recalculateAll: () => void
}

const EMPTY_CELL: SpreadsheetCell = { raw: '', computed: null }

/** Convert column index (0-based) to letter(s): 0→A, 25→Z, 26→AA, 27→AB */
function colToLetter(index: number): string {
  let result = ''
  let n = index
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  }
  return result
}

/** Convert letter(s) to column index (0-based): A→0, Z→25, AA→26 */
function letterToCol(letters: string): number {
  let index = 0
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64)
  }
  return index - 1
}

/** Build a topological ordering of cells so dependencies are resolved first */
function topologicalSort(
  refs: string[],
  cells: Record<string, SpreadsheetCell>,
): string[] {
  const deps = new Map<string, Set<string>>()
  for (const ref of refs) {
    deps.set(ref, new Set())
    const cell = cells[ref]
    if (cell?.raw.startsWith('=')) {
      // Extract cell references from formula
      const matches = cell.raw.match(/[A-Z]{1,3}\d{1,4}/g)
      if (matches) {
        for (const depRef of matches) {
          if (cells[depRef] && depRef !== ref) {
            deps.get(ref)!.add(depRef)
          }
        }
      }
    }
  }

  const visited = new Set<string>()
  const order: string[] = []

  function visit(ref: string) {
    if (visited.has(ref)) return
    visited.add(ref)
    for (const dep of deps.get(ref) ?? []) {
      visit(dep)
    }
    order.push(ref)
  }

  for (const ref of refs) {
    visit(ref)
  }
  return order
}

const firstSheetId = generateId()
export const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  sheets: [{ id: firstSheetId, name: 'Sheet 1', cells: {} }],
  activeSheetId: firstSheetId,

  getActiveSheet: () => {
    const { sheets, activeSheetId } = get()
    return sheets.find((s) => s.id === activeSheetId) || sheets[0]
  },

  getCell: (sheetId, ref) => {
    const sheet = get().sheets.find((s) => s.id === sheetId)
    if (!sheet) return EMPTY_CELL
    return sheet.cells[ref] || { ...EMPTY_CELL }
  },

  setCell: (ref, raw) => {
    const { activeSheetId } = get()
    set((s) => ({
      sheets: s.sheets.map((sheet) => {
        if (sheet.id !== activeSheetId) return sheet

        const getCell = (cellRef: CellRef) => {
          const key = colToLetter(cellRef.col) + cellRef.row
          const cell = sheet.cells[key]
          if (!cell) return null
          return cell.computed
        }

        const result = evaluateFormula(raw, getCell)

        return {
          ...sheet,
          cells: {
            ...sheet.cells,
            [ref]: { raw, computed: result.value, error: result.error },
          },
        }
      }),
    }))
  },

  addSheet: (name) => {
    const newSheet: Sheet = { id: generateId(), name: name || `Sheet ${get().sheets.length + 1}`, cells: {} }
    set((s) => ({ sheets: [...s.sheets, newSheet], activeSheetId: newSheet.id }))
    return newSheet.id
  },

  removeSheet: (id) => {
    set((s) => {
      const filtered = s.sheets.filter((sh) => sh.id !== id)
      if (s.activeSheetId === id && filtered.length > 0) {
        return { sheets: filtered, activeSheetId: filtered[0].id }
      }
      if (filtered.length === 0) {
        // Don't allow removing the last sheet
        return s
      }
      return { sheets: filtered }
    })
  },

  renameSheet: (id, name) => {
    set((s) => ({
      sheets: s.sheets.map((sh) => sh.id === id ? { ...sh, name } : sh),
    }))
  },

  setActiveSheet: (id) => set({ activeSheetId: id }),

  recalculateAll: () => {
    const { activeSheetId } = get()
    set((s) => ({
      sheets: s.sheets.map((sheet) => {
        if (sheet.id !== activeSheetId) return sheet

        const refs = Object.keys(sheet.cells)
        const ordered = topologicalSort(refs, sheet.cells)

        const newCells: Record<string, SpreadsheetCell> = {}
        for (const ref of ordered) {
          const cell = sheet.cells[ref]
          if (!cell) continue
          if (cell.raw.startsWith('=')) {
            const getCell = (cellRef: CellRef) => {
              const key = colToLetter(cellRef.col) + cellRef.row
              const c = newCells[key] || sheet.cells[key]
              if (!c) return null
              return c.computed
            }
            const result = evaluateFormula(cell.raw, getCell)
            newCells[ref] = { raw: cell.raw, computed: result.value, error: result.error }
          } else {
            newCells[ref] = cell
          }
        }
        return { ...sheet, cells: newCells }
      }),
    }))
  },
}))
