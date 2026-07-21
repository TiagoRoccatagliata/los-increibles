// Funciones puras de métricas: usables en server y client components.

// Tipos planos (serializables a client components: sin Decimal ni Date)
export type PlainTx = {
  id: string
  propertyId: string
  date: string // ISO
  category: string
  direction: 'INGRESO' | 'EGRESO'
  currency: 'USD' | 'ARS'
  amount: number
  exchangeRate: number
  amountUsd: number
  notes: string | null
}

export type PlainValuation = {
  id: string
  propertyId: string
  date: string
  valueUsd: number
  source: string | null
}

export type PlainProperty = {
  id: string
  name: string
  address: string
  city: string
  description: string | null
  type: string
  status: 'COMPRADA' | 'EN_OBRA' | 'EN_VENTA' | 'VENDIDA'
  purchaseDate: string
  purchasePriceUsd: number
  listingPriceUsd: number | null
  saleDate: string | null
  salePriceUsd: number | null
  surfaceM2: number | null
  rooms: number | null
  transactions: PlainTx[]
  valuations: PlainValuation[]
}

// ----- Métricas por propiedad -----

/** Total invertido: suma de todos los egresos en USD */
export function investedUsd(p: PlainProperty): number {
  return p.transactions
    .filter((t) => t.direction === 'EGRESO')
    .reduce((s, t) => s + t.amountUsd, 0)
}

/** Ingresos totales (incluye la venta si está registrada como transacción) */
export function incomeUsd(p: PlainProperty): number {
  return p.transactions
    .filter((t) => t.direction === 'INGRESO')
    .reduce((s, t) => s + t.amountUsd, 0)
}

/**
 * Valor de mercado estimado de la propiedad hoy.
 * Vendida → precio de venta. Si no: última valuación, o precio de
 * publicación, o precio de compra como piso.
 */
export function currentValueUsd(p: PlainProperty): number {
  if (p.status === 'VENDIDA' && p.salePriceUsd) return p.salePriceUsd
  const lastValuation = p.valuations[p.valuations.length - 1]
  return lastValuation?.valueUsd ?? p.listingPriceUsd ?? p.purchasePriceUsd
}

/** Ganancia: realizada si está vendida, proyectada (valor actual) si no */
export function profitUsd(p: PlainProperty): number {
  const invested = investedUsd(p)
  if (p.status === 'VENDIDA') {
    // Venta + otros ingresos − todos los egresos
    const saleIncome = incomeUsd(p) || p.salePriceUsd || 0
    return saleIncome - invested
  }
  return currentValueUsd(p) + incomeUsd(p) - invested
}

export function roi(p: PlainProperty): number {
  const invested = investedUsd(p)
  return invested > 0 ? profitUsd(p) / invested : 0
}

/** Días de tenencia: compra → venta (o hoy si sigue en cartera) */
export function holdingDays(p: PlainProperty): number {
  const start = new Date(p.purchaseDate).getTime()
  const end = p.saleDate ? new Date(p.saleDate).getTime() : Date.now()
  return Math.max(1, Math.round((end - start) / 86_400_000))
}

/** ROI anualizado (interés compuesto equivalente) */
export function annualizedRoi(p: PlainProperty): number {
  const r = roi(p)
  const years = holdingDays(p) / 365
  if (years <= 0 || 1 + r <= 0) return 0
  return Math.pow(1 + r, 1 / years) - 1
}

/**
 * Antigüedad en días de la última valuación cargada, o null si nunca se
 * valuó (en ese caso currentValueUsd cae al precio de publicación/compra).
 */
export function valuationAgeDays(p: PlainProperty, now = new Date()): number | null {
  const last = p.valuations[p.valuations.length - 1]
  if (!last) return null
  return Math.max(0, Math.round((now.getTime() - new Date(last.date).getTime()) / 86_400_000))
}

const RECURRING_CATEGORIES = new Set(['EXPENSAS', 'IMPUESTOS', 'SERVICIOS'])

/**
 * Costo de tenencia mensual estimado: promedio de egresos recurrentes
 * (expensas, impuestos, servicios) de los últimos `windowMonths` meses.
 */
export function monthlyHoldingCost(p: PlainProperty, windowMonths = 6, now = new Date()): number {
  const from = new Date(now)
  from.setUTCMonth(from.getUTCMonth() - windowMonths)
  const fromIso = from.toISOString()
  const total = p.transactions
    .filter(
      (t) =>
        t.direction === 'EGRESO' && RECURRING_CATEGORIES.has(t.category) && t.date >= fromIso,
    )
    .reduce((s, t) => s + t.amountUsd, 0)
  return total / windowMonths
}

export type M2Reference = { name: string; usdPerM2: number; basis: string }

/**
 * USD/m² implícito de cada propiedad con superficie conocida, como
 * referencia para valuar: usa venta > última valuación > compra.
 */
export function m2References(props: PlainProperty[]): M2Reference[] {
  return props
    .filter((p) => p.surfaceM2 && p.surfaceM2 > 0)
    .map((p) => {
      const lastValuation = p.valuations[p.valuations.length - 1]
      const [value, basis] =
        p.status === 'VENDIDA' && p.salePriceUsd
          ? [p.salePriceUsd, 'venta']
          : lastValuation
            ? [lastValuation.valueUsd, 'valuación']
            : [p.purchasePriceUsd, 'compra']
      return { name: p.name, usdPerM2: value / p.surfaceM2!, basis }
    })
    .sort((a, b) => b.usdPerM2 - a.usdPerM2)
}

// ----- Métricas de portfolio -----

export type PortfolioSummary = {
  totalInvested: number
  currentValue: number // valor de mercado de las propiedades en cartera
  realizedProfit: number
  projectedProfit: number
  byStatus: Record<string, number>
}

export function portfolioSummary(props: PlainProperty[]): PortfolioSummary {
  const active = props.filter((p) => p.status !== 'VENDIDA')
  const sold = props.filter((p) => p.status === 'VENDIDA')
  const byStatus: Record<string, number> = {}
  for (const p of props) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
  return {
    totalInvested: props.reduce((s, p) => s + investedUsd(p), 0),
    currentValue: active.reduce((s, p) => s + currentValueUsd(p), 0),
    realizedProfit: sold.reduce((s, p) => s + profitUsd(p), 0),
    projectedProfit: active.reduce((s, p) => s + profitUsd(p), 0),
    byStatus,
  }
}

// ----- Series temporales -----

export type MonthlyCashflow = { month: string; ingreso: number; egreso: number }

/** Ingresos y egresos por mes (YYYY-MM), en USD */
export function monthlyCashflow(props: PlainProperty[], propertyId?: string): MonthlyCashflow[] {
  const byMonth = new Map<string, { ingreso: number; egreso: number }>()
  for (const p of props) {
    if (propertyId && p.id !== propertyId) continue
    for (const t of p.transactions) {
      const month = t.date.slice(0, 7)
      const e = byMonth.get(month) ?? { ingreso: 0, egreso: 0 }
      if (t.direction === 'INGRESO') e.ingreso += t.amountUsd
      else e.egreso += t.amountUsd
      byMonth.set(month, e)
    }
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }))
}

export type EvolutionPoint = { month: string; values: Record<string, number>; total: number }

/**
 * Evolución mensual del valor del portfolio: para cada mes, el valor
 * estimado de cada propiedad en cartera en ese momento (compra →
 * interpolación entre valuaciones → venta; 0 después de vendida).
 */
export function portfolioEvolution(props: PlainProperty[]): EvolutionPoint[] {
  if (props.length === 0) return []
  const months: string[] = []
  const first = props.reduce(
    (min, p) => (p.purchaseDate < min ? p.purchaseDate : min),
    props[0].purchaseDate,
  )
  const cursor = new Date(first.slice(0, 7) + '-01T00:00:00Z')
  const now = new Date()
  while (cursor <= now) {
    months.push(cursor.toISOString().slice(0, 7))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return months.map((month) => {
    const monthEnd = month + '-28'
    const values: Record<string, number> = {}
    for (const p of props) {
      if (p.purchaseDate.slice(0, 7) > month) continue
      if (p.saleDate && p.saleDate.slice(0, 10) <= monthEnd) continue
      values[p.name] = valueAt(p, monthEnd)
    }
    const total = Object.values(values).reduce((s, v) => s + v, 0)
    return { month, values, total }
  })
}

/** Valor estimado de una propiedad a una fecha: última valuación anterior, o compra */
function valueAt(p: PlainProperty, isoDate: string): number {
  let value = p.purchasePriceUsd
  for (const v of p.valuations) {
    if (v.date.slice(0, 10) <= isoDate) value = v.valueUsd
  }
  return value
}
