// Lógica de decisión: posición por socio y salud de la caja.
// Funciones puras (usables en server y client components).

import {
  currentValueUsd,
  monthlyHoldingCost,
  valuationAgeDays,
  type PlainProperty,
} from '@/lib/metrics'
import type { PlainCajaMovement, PlainMember } from '@/lib/consorcio'

// ----- Posición por socio -----

export type MemberPosition = {
  name: string
  sharePct: number
  contributedUsd: number // aportes según el sheet (GENERAL)
  withdrawnUsd: number // retiros/liquidaciones ya cobrados
  entitledUsd: number // le corresponde hoy: sharePct × NAV
  profitUsd: number // entitled + retirado − aportado
  personalRoi: number
}

/**
 * Valor del consorcio hoy (NAV): propiedades activas a valor de mercado,
 * neto de costos de salida estimados, más el saldo de caja.
 */
export function consortiumNav(
  props: PlainProperty[],
  cajaBalanceUsd: number,
  exitFeePct = 4,
): number {
  const propertiesValue = props
    .filter((p) => p.status !== 'VENDIDA')
    .reduce((s, p) => s + currentValueUsd(p) * (1 - exitFeePct / 100), 0)
  return propertiesValue + cajaBalanceUsd
}

export function memberPositions(
  members: PlainMember[],
  props: PlainProperty[],
  cajaBalanceUsd: number,
  exitFeePct = 4,
): MemberPosition[] {
  const nav = consortiumNav(props, cajaBalanceUsd, exitFeePct)
  return members.map((m) => {
    const withdrawn = m.movements.reduce((s, mv) => s + mv.outUsd, 0)
    const entitled = (m.sharePct / 100) * nav
    const profit = entitled + withdrawn - m.contributionsUsd
    return {
      name: m.name,
      sharePct: m.sharePct,
      contributedUsd: m.contributionsUsd,
      withdrawnUsd: withdrawn,
      entitledUsd: entitled,
      profitUsd: profit,
      personalRoi: m.contributionsUsd > 0 ? profit / m.contributionsUsd : 0,
    }
  })
}

// ----- Salud de la caja -----

export type CajaHealth = {
  balanceUsd: number
  monthlyBurnUsd: number // egresos netos promedio por mes (últimos 6 meses); > 0 = la caja se achica
  runwayMonths: number | null // null = la caja no se está achicando
  projection: { month: string; balance: number }[] // próximos 12 meses
}

export function cajaHealth(
  movs: PlainCajaMovement[],
  windowMonths = 6,
  now = new Date(),
): CajaHealth {
  const balance = movs.reduce((s, m) => s + m.inUsd - m.outUsd, 0)

  const from = new Date(now)
  from.setUTCMonth(from.getUTCMonth() - windowMonths)
  const fromIso = from.toISOString()
  // Los aportes grandes y ventas distorsionan el burn: acá interesa el goteo
  // operativo, así que se excluyen entradas puntuales mayores a USD 5.000.
  const recent = movs.filter((m) => m.date >= fromIso)
  const outflow = recent.reduce((s, m) => s + m.outUsd, 0)
  const inflow = recent.filter((m) => m.inUsd <= 5000).reduce((s, m) => s + m.inUsd, 0)
  const burn = (outflow - inflow) / windowMonths

  const projection: { month: string; balance: number }[] = []
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  for (let i = 1; i <= 12; i++) {
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    projection.push({
      month: cursor.toISOString().slice(0, 7),
      balance: balance - burn * i,
    })
  }

  return {
    balanceUsd: balance,
    monthlyBurnUsd: burn,
    runwayMonths: burn > 0 ? balance / burn : null,
    projection,
  }
}

/** Propiedades activas ordenadas por lo que queman por mes (mayor primero) */
export function holdingCostRanking(
  props: PlainProperty[],
): { name: string; id: string; monthlyUsd: number }[] {
  return props
    .filter((p) => p.status !== 'VENDIDA')
    .map((p) => ({ name: p.name, id: p.id, monthlyUsd: monthlyHoldingCost(p) }))
    .sort((a, b) => b.monthlyUsd - a.monthlyUsd)
}

// ----- Alertas para el dashboard -----

export type Alert = { severity: 'red' | 'amber'; text: string; href: string }

export function buildAlerts(
  props: PlainProperty[],
  caja: CajaHealth,
  now = new Date(),
): Alert[] {
  const alerts: Alert[] = []

  if (caja.runwayMonths !== null && caja.runwayMonths < 3) {
    alerts.push({
      severity: caja.runwayMonths < 1.5 ? 'red' : 'amber',
      text: `La caja cubre solo ~${caja.runwayMonths.toFixed(1)} meses de gastos: pronto va a hacer falta un aporte o una venta.`,
      href: '/caja',
    })
  }

  for (const p of props) {
    if (p.status === 'VENDIDA') continue
    const age = valuationAgeDays(p, now)
    if (age === null) {
      alerts.push({
        severity: 'red',
        text: `${p.name} no tiene valuación cargada: la ganancia proyectada usa el precio de compra.`,
        href: `/propiedades/${p.id}`,
      })
    } else if (age > 120) {
      alerts.push({
        severity: 'amber',
        text: `La valuación de ${p.name} tiene ${Math.floor(age / 30)} meses: conviene actualizarla.`,
        href: `/propiedades/${p.id}`,
      })
    }
    if (p.status === 'EN_VENTA') {
      const lastValuation = p.valuations[p.valuations.length - 1]
      const monthsListed = Math.floor(
        (now.getTime() - new Date(lastValuation?.date ?? p.purchaseDate).getTime()) / 2_592_000_000,
      )
      if (monthsListed >= 6) {
        alerts.push({
          severity: 'amber',
          text: `${p.name} está en venta hace ~${monthsListed} meses sin cerrarse: mirá el simulador para evaluar bajar el precio.`,
          href: `/propiedades/${p.id}`,
        })
      }
    }
  }

  return alerts
}
