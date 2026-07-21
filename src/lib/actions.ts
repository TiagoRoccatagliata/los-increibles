'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncFromSheet as runSync, type SyncResult } from '@/lib/sync'

export async function syncFromSheet(): Promise<SyncResult> {
  const result = await runSync()
  revalidatePath('/', 'layout')
  return result
}

export async function addValuation(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const propertyId = String(formData.get('propertyId') ?? '')
  const valueUsd = Number(formData.get('valueUsd'))
  const dateRaw = String(formData.get('date') ?? '')
  const source = String(formData.get('source') ?? '').trim()

  if (!propertyId) return { ok: false, message: 'Falta la propiedad.' }
  if (!Number.isFinite(valueUsd) || valueUsd <= 0)
    return { ok: false, message: 'El valor tiene que ser un número mayor a cero.' }
  const date = dateRaw ? new Date(dateRaw + 'T00:00:00Z') : new Date()
  if (Number.isNaN(date.getTime())) return { ok: false, message: 'Fecha inválida.' }

  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) return { ok: false, message: 'La propiedad no existe.' }

  await prisma.valuation.create({
    data: { propertyId, date, valueUsd, source: source || null },
  })
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteValuation(id: string): Promise<void> {
  await prisma.valuation.delete({ where: { id } }).catch(() => {})
  revalidatePath('/', 'layout')
}
