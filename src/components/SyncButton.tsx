'use client'

import { useState, useTransition } from 'react'
import { syncFromSheet } from '@/lib/actions'

export default function SyncButton() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="relative">
      <button
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const r = await syncFromSheet()
            if (!r.ok) setError(r.message)
          })
        }}
        disabled={pending}
        className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
        title="Traer los datos actualizados del Google Sheet"
      >
        {pending ? 'Sincronizando…' : '⟳ Sincronizar'}
      </button>
      {error && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-red-900 bg-slate-900 p-3 text-xs text-red-400 shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
