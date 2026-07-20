'use client'

import { useMemo, useState } from 'react'
import { monthlyCashflow, type PlainProperty } from '@/lib/metrics'
import { fmtUsdExact } from '@/lib/format'
import CashflowChart from '@/components/charts/CashflowChart'
import { inputCls } from '@/components/ui/Field'

const fmtMonth = (m: string) => {
  const [y, mm] = m.split('-')
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(y), Number(mm) - 1, 15)))
}

export default function CashflowReport({ properties }: { properties: PlainProperty[] }) {
  const [propertyId, setPropertyId] = useState('')
  const data = useMemo(
    () => monthlyCashflow(properties, propertyId || undefined),
    [properties, propertyId],
  )

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-slate-400" htmlFor="prop-filter">Propiedad:</label>
        <select
          id="prop-filter"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className={`${inputCls} mt-0 w-auto`}
        >
          <option value="">Todas</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <CashflowChart data={data} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Mes</th>
              <th className="px-4 py-3 text-right font-medium">Ingresos (USD)</th>
              <th className="px-4 py-3 text-right font-medium">Egresos (USD)</th>
              <th className="px-4 py-3 text-right font-medium">Neto (USD)</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d) => {
              const net = d.ingreso - d.egreso
              return (
                <tr key={d.month} className="border-t border-slate-800">
                  <td className="px-4 py-2.5 capitalize text-slate-300">{fmtMonth(d.month)}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400">
                    {d.ingreso > 0 ? fmtUsdExact(d.ingreso) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-red-400">
                    {d.egreso > 0 ? fmtUsdExact(d.egreso) : '—'}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-medium ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtUsdExact(net)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
