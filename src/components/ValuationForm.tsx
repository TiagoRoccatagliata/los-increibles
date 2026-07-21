'use client'

import { useRef, useState, useTransition } from 'react'
import { addValuation, deleteValuation } from '@/lib/actions'
import { fmtDate, fmtUsd } from '@/lib/format'
import type { M2Reference, PlainValuation } from '@/lib/metrics'

type Props = {
  propertyId: string
  valuations: PlainValuation[]
  surfaceM2: number | null
  references: M2Reference[] // USD/m² del resto del portfolio, para orientar
}

export default function ValuationForm({ propertyId, valuations, surfaceM2, references }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const valueNum = Number(value)
  const impliedM2 = surfaceM2 && valueNum > 0 ? valueNum / surfaceM2 : null

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-semibold">Valuaciones</h2>
      <p className="mb-3 text-sm text-slate-500">
        ¿Cuánto vale hoy? Cargala cada vez que revisen publicaciones parecidas de la zona: todos
        los análisis (ganancia proyectada, posición por socio, benchmark) salen de acá.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          ref={formRef}
          action={(formData) => {
            setError(null)
            startTransition(async () => {
              const r = await addValuation(formData)
              if (!r.ok) setError(r.message ?? 'No se pudo guardar.')
              else {
                formRef.current?.reset()
                setValue('')
              }
            })
          }}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block sm:col-span-1">
              <span className="text-xs text-slate-500">Valor de mercado (USD)</span>
              <input
                name="valueUsd"
                type="number"
                min="1"
                step="any"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="85000"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-600 focus:outline-none"
              />
            </label>
            <label className="col-span-2 block sm:col-span-1">
              <span className="text-xs text-slate-500">Fecha</span>
              <input
                name="date"
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-sky-600 focus:outline-none"
              />
            </label>
            <label className="col-span-2 block">
              <span className="text-xs text-slate-500">¿De dónde salió el número?</span>
              <input
                name="source"
                type="text"
                placeholder="Ej: Zonaprop, 3 deptos similares en la zona"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-600 focus:outline-none"
              />
            </label>
          </div>

          {impliedM2 !== null && (
            <p className="mt-3 text-xs text-slate-500">
              Ese valor equivale a{' '}
              <span className="font-medium text-slate-300">{fmtUsd(impliedM2)}/m²</span>
              {references.length > 0 && ' — comparalo con el resto del portfolio a la derecha.'}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {pending ? 'Guardando…' : 'Guardar valuación'}
          </button>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </form>

        <div className="space-y-4">
          {references.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-300">
                Referencia: USD/m² del portfolio
              </h3>
              <ul className="space-y-1.5 text-sm">
                {references.map((r) => (
                  <li key={r.name} className="flex items-center justify-between">
                    <span className="text-slate-400">
                      {r.name} <span className="text-xs text-slate-600">({r.basis})</span>
                    </span>
                    <span className="font-medium text-white">{fmtUsd(r.usdPerM2)}/m²</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">Historial</h3>
            {valuations.length === 0 ? (
              <p className="text-sm text-slate-500">
                Sin valuaciones: se está usando el precio de publicación o compra como valor.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {[...valuations].reverse().map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">
                      {fmtDate(v.date)}
                      {v.source && <span className="text-xs text-slate-600"> · {v.source}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-white">{fmtUsd(v.valueUsd)}</span>
                      <button
                        onClick={() => startTransition(() => deleteValuation(v.id))}
                        disabled={pending}
                        title="Borrar valuación"
                        className="text-slate-600 hover:text-red-400 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
