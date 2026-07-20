import { prisma } from '@/lib/prisma'
import type { PlainProperty } from '@/lib/metrics'

/** Carga todas las propiedades con sus movimientos, en forma plana serializable */
export async function getPortfolio(): Promise<PlainProperty[]> {
  const props = await prisma.property.findMany({
    include: {
      transactions: { orderBy: { date: 'asc' } },
      valuations: { orderBy: { date: 'asc' } },
    },
    orderBy: { purchaseDate: 'asc' },
  })
  return props.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    city: p.city,
    description: p.description,
    type: p.type,
    status: p.status,
    purchaseDate: p.purchaseDate.toISOString(),
    purchasePriceUsd: Number(p.purchasePriceUsd),
    listingPriceUsd: p.listingPriceUsd ? Number(p.listingPriceUsd) : null,
    saleDate: p.saleDate?.toISOString() ?? null,
    salePriceUsd: p.salePriceUsd ? Number(p.salePriceUsd) : null,
    surfaceM2: p.surfaceM2 ? Number(p.surfaceM2) : null,
    rooms: p.rooms,
    transactions: p.transactions.map((t) => ({
      id: t.id,
      propertyId: t.propertyId,
      date: t.date.toISOString(),
      category: t.category,
      direction: t.direction,
      currency: t.currency,
      amount: Number(t.amount),
      exchangeRate: Number(t.exchangeRate),
      amountUsd: Number(t.amountUsd),
      notes: t.notes,
    })),
    valuations: p.valuations.map((v) => ({
      id: v.id,
      propertyId: v.propertyId,
      date: v.date.toISOString(),
      valueUsd: Number(v.valueUsd),
      source: v.source,
    })),
  }))
}
