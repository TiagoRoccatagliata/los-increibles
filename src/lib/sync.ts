import { prisma } from '@/lib/prisma'
import type { TxCategory } from '@/generated/prisma/enums'
import { fetchTab, parseDate, parseMoney } from '@/lib/sheets'

// Pestañas del sheet del consorcio
const GTS_TABS: { tab: string; keyword: string }[] = [
  { tab: 'GTS.TUCUMAN', keyword: 'TUCUMAN' },
  { tab: 'GTS.SAN MARTIN', keyword: 'SAN MARTIN' },
  { tab: 'GTS.FUNES', keyword: 'FUNES' },
  { tab: 'GTS.ALSINA', keyword: 'ALSINA' },
  { tab: 'GTS.FALUCHO', keyword: 'FALUCHO' },
]
const MEMBER_TABS = ['JAVI', 'JULIA', 'CATA', 'JOACO', 'TIAGO']

type Movement = { date: Date; concept: string; col2: number; col3: number; notes: string | null }

/**
 * Filas de movimientos (GTS.*, tabs de socios, CAJA): A fecha, B concepto,
 * C y D montos, E saldo acumulado. Sin fecha se hereda la anterior; se
 * descartan encabezados, filas ANULADO y el relleno de saldo del final.
 */
function parseMovements(rows: string[][]): Movement[] {
  const out: Movement[] = []
  let lastDate: Date | null = null
  for (const row of rows) {
    const concept = (row[1] ?? '').trim()
    const date: Date | null = parseDate(row[0]) ?? lastDate
    if (!concept || concept.toUpperCase() === 'MOVIMIENTOS' || concept.toUpperCase() === 'ANULADO')
      continue
    const col2 = parseMoney(row[2]) ?? 0
    const col3 = parseMoney(row[3]) ?? 0
    if (col2 === 0 && col3 === 0) continue
    // Misma cifra en debe y haber = anotación neto cero (p.ej. "VENTA DE LA UNIDAD")
    if (col2 > 0 && col2 === col3) continue
    if (!date) continue
    lastDate = date
    const extra = row
      .slice(5, 8)
      .map((c) => c.trim())
      .filter(Boolean)
      .join(' · ')
    out.push({ date, concept, col2, col3, notes: extra || null })
  }
  return out
}

/** Categoría de gasto inferida del concepto */
function categorize(concept: string): TxCategory {
  const c = concept
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/COMISION/.test(c)) return 'COMISION'
  if (/ESCRIB|SELLADO|BOLETO|CERTIFICADO/.test(c)) return 'ESCRITURA'
  if (/EXPENSAS/.test(c)) return 'EXPENSAS'
  if (/\bLUZ\b|\bGAS\b|\bAGUA\b|EDEA|OSSE|\bMUNI|MUNICIPAL|AMBITO|INTERNET|CAMUZZI/.test(c))
    return 'SERVICIOS'
  if (/INMOBILIARIO|IMPUESTO|\bIVA\b|ARBA|AFIP/.test(c)) return 'IMPUESTOS'
  if (/PAGO DEPTO|PAGO DEPARTAMENTO|COMPRA|SENA|SEÑA/.test(c)) return 'COMPRA'
  if (/COBRO|VENTA/.test(c)) return 'VENTA'
  if (/AIRBNB|ALQ|LIQ/.test(c)) return 'OTRO'
  return 'REFACCION'
}

export type SyncResult = { ok: boolean; message: string }

export async function syncFromSheet(): Promise<SyncResult> {
  try {
    // 1. Leer todas las pestañas en paralelo
    const [unidades, general, caja, liquidaciones, gtsData, memberData] = await Promise.all([
      fetchTab('UNIDADES'),
      fetchTab('GENERAL'),
      fetchTab('CAJA'),
      fetchTab('LIQUIDACIONES'),
      Promise.all(GTS_TABS.map(async (g) => ({ ...g, rows: await fetchTab(g.tab) }))),
      Promise.all(MEMBER_TABS.map(async (name) => ({ name, rows: await fetchTab(name) }))),
    ])

    // 2. Propiedades desde UNIDADES
    const properties = unidades
      .slice(1)
      .filter((r) => (r[0] ?? '').trim() && parseDate(r[6]))
      .map((r) => {
        const name = r[0].trim()
        const saleDate = parseDate(r[7])
        return {
          name,
          address: name,
          city: 'Mar del Plata',
          type: 'DEPARTAMENTO' as const,
          status: saleDate ? ('VENDIDA' as const) : ('EN_VENTA' as const),
          purchaseDate: parseDate(r[6])!,
          purchasePriceUsd: parseMoney(r[2]) ?? 0,
          listingPriceUsd: saleDate ? null : parseMoney(r[3]),
          saleDate,
          salePriceUsd: saleDate ? parseMoney(r[3]) : null,
        }
      })

    // 3. Integrantes desde GENERAL
    const members = general
      .slice(1)
      .filter((r) => {
        const name = (r[0] ?? '').trim()
        return name && !name.toUpperCase().startsWith('TOTAL')
      })
      .map((r) => ({
        name: r[0].trim(),
        category: (r[1] ?? '').trim(),
        contributionsUsd: parseMoney(r[2]) ?? 0,
        sharePct: parseMoney(r[3]) ?? 0,
      }))

    // 4. Movimientos
    const gtsMovs = gtsData.map((g) => ({ ...g, movements: parseMovements(g.rows) }))
    const memberMovs = memberData.map((m) => ({ ...m, movements: parseMovements(m.rows) }))
    const cajaMovs = parseMovements(caja)

    // 5. Liquidaciones: FECHA, IMPORTE, luego una columna por socio
    const liqHeader = liquidaciones[1] ?? []
    const liqMemberCols = liqHeader
      .map((h, i) => ({ name: h.trim(), i }))
      .filter((c) => c.i >= 2 && c.name)
    const liqs = liquidaciones
      .slice(2)
      .filter((r) => parseDate(r[0]) && parseMoney(r[1]))
      .map((r) => ({
        date: parseDate(r[0])!,
        totalUsd: parseMoney(r[1])!,
        shares: Object.fromEntries(
          liqMemberCols.map((c) => [c.name, parseMoney(r[c.i]) ?? 0]),
        ) as Record<string, number>,
      }))

    // 6. Reemplazo total en una transacción
    let txCount = 0
    await prisma.$transaction(
      async (db) => {
        await db.property.deleteMany()
        await db.member.deleteMany()
        await db.cajaMovement.deleteMany()
        await db.liquidation.deleteMany()

        for (const p of properties) {
          const created = await db.property.create({ data: p })
          const gts = gtsMovs.find((g) => p.name.toUpperCase().includes(g.keyword))
          type TxRow = {
            propertyId: string
            date: Date
            category: TxCategory
            direction: 'EGRESO' | 'INGRESO'
            currency: 'USD'
            amount: number
            exchangeRate: number
            amountUsd: number
            notes: string
          }
          const txs = (gts?.movements ?? []).flatMap((m) => {
            const rows: TxRow[] = []
            // C = gasto (egreso), D = recupero (ingreso)
            if (m.col2 > 0)
              rows.push({
                propertyId: created.id,
                date: m.date,
                category: categorize(m.concept),
                direction: 'EGRESO' as const,
                currency: 'USD' as const,
                amount: m.col2,
                exchangeRate: 1,
                amountUsd: m.col2,
                notes: m.concept + (m.notes ? ` (${m.notes})` : ''),
              })
            if (m.col3 > 0)
              rows.push({
                propertyId: created.id,
                date: m.date,
                category: 'OTRO' as const,
                direction: 'INGRESO' as const,
                currency: 'USD' as const,
                amount: m.col3,
                exchangeRate: 1,
                amountUsd: m.col3,
                notes: m.concept + (m.notes ? ` (${m.notes})` : ''),
              })
            return rows
          })
          // La venta no figura en GTS: se genera desde UNIDADES
          if (p.saleDate && p.salePriceUsd) {
            txs.push({
              propertyId: created.id,
              date: p.saleDate,
              category: 'VENTA' as TxCategory,
              direction: 'INGRESO' as const,
              currency: 'USD' as const,
              amount: p.salePriceUsd,
              exchangeRate: 1,
              amountUsd: p.salePriceUsd,
              notes: 'Venta (desde pestaña UNIDADES)',
            })
          }
          if (txs.length) await db.transaction.createMany({ data: txs })
          txCount += txs.length
        }

        for (const m of members) {
          const created = await db.member.create({ data: m })
          const tab = memberMovs.find((t) => t.name === m.name.toUpperCase())
          if (tab?.movements.length) {
            await db.memberMovement.createMany({
              data: tab.movements.map((mv) => ({
                memberId: created.id,
                date: mv.date,
                concept: mv.concept,
                inUsd: mv.col2,
                outUsd: mv.col3,
                notes: mv.notes,
              })),
            })
          }
        }

        if (cajaMovs.length) {
          await db.cajaMovement.createMany({
            data: cajaMovs.map((m) => ({
              date: m.date,
              concept: m.concept,
              inUsd: m.col2,
              outUsd: m.col3,
            })),
          })
        }

        if (liqs.length) {
          await db.liquidation.createMany({ data: liqs })
        }
      },
      { timeout: 60_000 },
    )

    const message = `${properties.length} propiedades, ${txCount} movimientos, ${members.length} socios, ${cajaMovs.length} movimientos de caja${liqs.length ? `, ${liqs.length} liquidaciones` : ''}.`
    await prisma.syncLog.create({ data: { ok: true, message } })
    return { ok: true, message }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await prisma.syncLog.create({ data: { ok: false, message } }).catch(() => {})
    return { ok: false, message }
  }
}
