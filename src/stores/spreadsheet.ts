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

  getActiveSheet: () => Sheet
  getCell: (sheetId: string, ref: string) => SpreadsheetCell
  setCell: (ref: string, raw: string) => void
  addSheet: (name?: string) => string
  removeSheet: (id: string) => void
  renameSheet: (id: string, name: string) => void
  setActiveSheet: (id: string) => void
  recalculateAll: () => void
}

const EMPTY_CELL: SpreadsheetCell = { raw: '', computed: null }

export const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  sheets: [{ id: generateId(), name: 'Sheet 1', cells: {} }],
  activeSheetId: '',

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

        // Evaluate formula
        const getCell = (cellRef: CellRef) => {
          const key = String.fromCharCode(64 + cellRef.col) + cellRef.row
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
    // Re-evaluate all cells with formulas
    const { activeSheetId } = get()
    set((s) => ({
      sheets: s.sheets.map((sheet) => {
        if (sheet.id !== activeSheetId) return sheet
        const newCells: Record<string, SpreadsheetCell> = {}
        for (const [ref, cell] of Object.entries(sheet.cells)) {
          if (cell.raw.startsWith('=')) {
            const getCell = (cellRef: CellRef) => {
              const key = String.fromCharCode(64 + cellRef.col) + cellRef.row
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
