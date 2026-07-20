'use server'

import { revalidatePath } from 'next/cache'
import { syncFromSheet as runSync, type SyncResult } from '@/lib/sync'

export async function syncFromSheet(): Promise<SyncResult> {
  const result = await runSync()
  revalidatePath('/', 'layout')
  return result
}
