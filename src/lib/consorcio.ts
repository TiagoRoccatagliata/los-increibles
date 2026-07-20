import { prisma } from '@/lib/prisma'

export type PlainMember = {
  id: string
  name: string
  category: string
  contributionsUsd: number
  sharePct: number
  movements: {
    id: string
    date: string
    concept: string
    inUsd: number
    outUsd: number
    notes: string | null
  }[]
}

export async function getMembers(): Promise<PlainMember[]> {
  const members = await prisma.member.findMany({
    include: { movements: { orderBy: { date: 'desc' } } },
    orderBy: { contributionsUsd: 'desc' },
  })
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    contributionsUsd: Number(m.contributionsUsd),
    sharePct: Number(m.sharePct),
    movements: m.movements.map((mv) => ({
      id: mv.id,
      date: mv.date.toISOString(),
      concept: mv.concept,
      inUsd: Number(mv.inUsd),
      outUsd: Number(mv.outUsd),
      notes: mv.notes,
    })),
  }))
}

export type PlainCajaMovement = {
  id: string
  date: string
  concept: string
  inUsd: number
  outUsd: number
}

export async function getCaja(): Promise<PlainCajaMovement[]> {
  const movs = await prisma.cajaMovement.findMany({ orderBy: { date: 'asc' } })
  return movs.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    concept: m.concept,
    inUsd: Number(m.inUsd),
    outUsd: Number(m.outUsd),
  }))
}

export function cajaBalance(movs: PlainCajaMovement[]): number {
  return movs.reduce((s, m) => s + m.inUsd - m.outUsd, 0)
}

export type PlainLiquidation = {
  id: string
  date: string
  totalUsd: number
  shares: Record<string, number>
}

export async function getLiquidations(): Promise<PlainLiquidation[]> {
  const liqs = await prisma.liquidation.findMany({ orderBy: { date: 'desc' } })
  return liqs.map((l) => ({
    id: l.id,
    date: l.date.toISOString(),
    totalUsd: Number(l.totalUsd),
    shares: (l.shares ?? {}) as Record<string, number>,
  }))
}

export async function getLastSync() {
  const log = await prisma.syncLog.findFirst({ orderBy: { syncedAt: 'desc' } })
  if (!log) return null
  return { syncedAt: log.syncedAt.toISOString(), ok: log.ok, message: log.message }
}
