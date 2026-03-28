/**
 * Export / Import / Share utilities for productivity documents.
 *
 * All functions are pure (no side-effects) except the two download helpers
 * which create temporary anchor elements and revoke them after use.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportableDocument {
  id: string
  type: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

// ---------------------------------------------------------------------------
// JSON round-trip
// ---------------------------------------------------------------------------

/** Serialize a document to a pretty-printed JSON string. */
export function exportToJSON(doc: ExportableDocument): string {
  return JSON.stringify(doc, null, 2)
}

/** Deserialize a JSON string into an `ExportableDocument`. Returns `null` on failure. */
export function importFromJSON(json: string): ExportableDocument | null {
  try {
    const parsed = JSON.parse(json)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.id !== 'string' ||
      typeof parsed.type !== 'string' ||
      typeof parsed.title !== 'string' ||
      typeof parsed.content !== 'string'
    ) {
      return null
    }
    return parsed as ExportableDocument
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// File downloads
// ---------------------------------------------------------------------------

/** Download a generic text blob as a file. */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Download an `ExportableDocument` as a `.json` file. */
export function downloadJSON(doc: ExportableDocument): void {
  downloadFile(exportToJSON(doc), `${doc.title}.json`, 'application/json')
}

// ---------------------------------------------------------------------------
// Format converters
// ---------------------------------------------------------------------------

/**
 * Export a document as HTML.
 * The `content` field from TipTap / CKEditor is already HTML, so we return it
 * wrapped in a minimal `<html>` shell for standalone viewing.
 */
export function exportToHTML(doc: ExportableDocument): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(doc.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1d1d1f; line-height: 1.6; }
    h1, h2, h3 { margin-top: 1.5em; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #666; }
    code { background: #f5f5f7; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f5f5f7; padding: 16px; border-radius: 8px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d2d2d7; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f7; }
  </style>
</head>
<body>
${doc.content}
</body>
</html>`
}

/** Escape special HTML characters for safe embedding. */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Convert spreadsheet cells to CSV.
 *
 * @param cells - A record keyed by cell ref (e.g. "A1") with `{ raw, computed }`.
 *                `computed` is used when present, otherwise `raw`.
 */
export function exportToCSV(
  cells: Record<string, { raw: string; computed: unknown }>,
): string {
  // Determine bounds
  let maxRow = 0
  let maxCol = 0
  for (const ref of Object.keys(cells)) {
    const match = ref.match(/^([A-Z]+)(\d+)$/)
    if (!match) continue
    const col = colToIndex(match[1])
    const row = parseInt(match[2], 10)
    if (col > maxCol) maxCol = col
    if (row > maxRow) maxRow = row
  }

  const rows: string[] = []
  for (let r = 1; r <= maxRow; r++) {
    const cols: string[] = []
    for (let c = 1; c <= maxCol; c++) {
      const ref = `${indexToCol(c)}${r}`
      const cell = cells[ref]
      const value =
        cell?.computed !== undefined && cell.computed !== null && cell.computed !== ''
          ? String(cell.computed)
          : cell?.raw ?? ''
      cols.push(csvEscape(value))
    }
    rows.push(cols.join(','))
  }
  return rows.join('\n')
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Convert a column index (1-based) to a letter (A, B, ..., Z, AA, ...). */
function indexToCol(index: number): string {
  let result = ''
  let n = index
  while (n > 0) {
    n--
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

/** Convert a column letter (A, B, ..., Z, AA, ...) to a 1-based index. */
function colToIndex(col: string): number {
  let index = 0
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64)
  }
  return index
}

// ---------------------------------------------------------------------------
// File reading
// ---------------------------------------------------------------------------

/** Read a `File` as plain text. */
export function readTextFile(file: File): Promise<string> {
  return file.text()
}

// ---------------------------------------------------------------------------
// Share URL
// ---------------------------------------------------------------------------

/** Generate a shareable URL with the document encoded as base64 in the query string. */
export function generateShareURL(doc: ExportableDocument): string {
  const json = exportToJSON(doc)
  const encoded = btoa(unescape(encodeURIComponent(json)))
  return `${window.location.origin}${window.location.pathname}?shared=${encoded}`
}

/** Load a document from a `?shared=` query parameter. Returns `null` if absent or invalid. */
export function loadFromShareURL(): ExportableDocument | null {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('shared')
  if (!encoded) return null
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return importFromJSON(json)
  } catch {
    return null
  }
}
