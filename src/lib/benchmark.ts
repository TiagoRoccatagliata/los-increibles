// Benchmark: ¿la plata del consorcio rindió más que las alternativas?
// Simula qué habría pasado si cada aporte (en su fecha real) hubiera ido
// a una inversión de tasa fija anual, y lo compara con el valor real hoy.

import type { PlainCajaMovement, PlainMember } from '@/lib/consorcio'
import { portfolioEvolution, type PlainProperty } from '@/lib/metrics'

export type Benchmark = { key: string; rate: number }

// Tasas anuales en USD de referencia (aprox. históricas, editables acá)
export const BENCHMARKS: Benchmark[] = [
  { key: 'Inflación USA (3%)', rate: 0.03 },
  { key: 'Plazo fijo USD (4%)', rate: 0.04 },
  { key: 'Bono Tesoro USA (4,5%)', rate: 0.045 },
  { key: 'S&P 500 (10% prom.)', rate: 0.1 },
]

export type Cashflow = { date: string; amount: number } // + aporte, − retiro

/** Aportes y retiros reales de todos los socios, ordenados por fecha */
export function contributionCashflows(members: PlainMember[]): Cashflow[] {
  return members
    .flatMap((m) =>
      m.movements
        .map((mv) => ({ date: mv.date, amount: mv.inUsd - mv.outUsd }))
        .filter((cf) => cf.amount !== 0),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Valor a `atIso` de invertir cada cashflow a tasa fija anual compuesta */
export function alternativeValueAt(cashflows: Cashflow[], rate: number, atIso: string): number {
  const at = new Date(atIso).getTime()
  let total = 0
  for (const cf of cashflows) {
    const t = new Date(cf.date).getTime()
    if (t > at) continue
    const years = (at - t) / (365 * 86_400_000)
    total += cf.amount * Math.pow(1 + rate, years)
  }
  return total
}

/**
 * Tasa anual compuesta que iguala los aportes reales con el valor actual
 * (TIR money-weighted), por bisección.
 */
export function moneyWeightedAnnualRate(
  cashflows: Cashflow[],
  currentValueUsd: number,
  now = new Date(),
): number | null {
  if (cashflows.length === 0) return null
  const nowIso = now.toISOString()
  const f = (r: number) => alternativeValueAt(cashflows, r, nowIso) - currentValueUsd
  let lo = -0.9
  let hi = 3
  if (f(lo) * f(hi) > 0) return null
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (f(lo) * f(mid) <= 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

export type BenchmarkPoint = { month: string; series: Record<string, number> }

/**
 * Serie mensual: valor real del consorcio (propiedades a valor estimado +
 * saldo de caja) contra cada alternativa alimentada con los mismos aportes.
 */
export function benchmarkSeries(
  cashflows: Cashflow[],
  props: PlainProperty[],
  caja: PlainCajaMovement[],
  benchmarks: Benchmark[] = BENCHMARKS,
): BenchmarkPoint[] {
  const evolution = portfolioEvolution(props)
  return evolution.map(({ month, total }) => {
    const monthEnd = month + '-28T00:00:00Z'
    const cajaAt = caja
      .filter((m) => m.date <= monthEnd)
      .reduce((s, m) => s + m.inUsd - m.outUsd, 0)
    const series: Record<string, number> = { Consorcio: total + cajaAt }
    for (const b of benchmarks) series[b.key] = alternativeValueAt(cashflows, b.rate, monthEnd)
    return { month, series }
  })
}
