// Lectura del Google Sheet público vía endpoint CSV de gviz (sin credenciales)

const SHEET_ID = () => {
  const id = process.env.SHEET_ID
  if (!id) throw new Error('Falta la variable de entorno SHEET_ID')
  return id
}

/** Parser CSV mínimo con soporte de comillas (formato que emite gviz) */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
    } else {
      cell += c
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

export async function fetchTab(tabName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID()}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`No pude leer la pestaña "${tabName}" (HTTP ${res.status}). ¿El sheet sigue compartido como "Cualquiera con el enlace: Lector"?`)
  }
  const text = await res.text()
  if (text.trimStart().startsWith('<')) {
    throw new Error(`La pestaña "${tabName}" devolvió HTML en vez de CSV: el sheet no es público o la pestaña no existe.`)
  }
  return parseCsv(text)
}

/** "$ 35.300,00" | "35.300,00" | "47674,18" → número (null si no parsea) */
export function parseMoney(raw: string | undefined): number | null {
  if (!raw) return null
  const s = raw.replace(/\$/g, '').replace(/\s/g, '')
  if (s === '' || s === '-') return null
  const neg = s.startsWith('-')
  const normalized = s.replace(/-/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  if (!Number.isFinite(n)) return null
  return neg ? -n : n
}

/** "17/6/24" | "12/3/2026" | "19/12/2024" → Date UTC (null si no parsea) */
export function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  const [, d, mo, yRaw] = m
  const y = yRaw.length === 2 ? 2000 + Number(yRaw) : Number(yRaw)
  const day = Number(d)
  const month = Number(mo)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return new Date(Date.UTC(y, month - 1, day))
}
