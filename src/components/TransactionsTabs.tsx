'use client'

import { useState } from 'react'
import Link from 'next/link'
import { incomeUsd, investedUsd, type PlainProperty } from '@/lib/metrics'
import { CATEGORY_LABELS, fmtDate, fmtUsd, fmtUsdExact } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'

export default function TransactionsTabs({ props }: { props: PlainProperty[] }) {
  const [selectedId, setSelectedId] = useState(props[0]?.id)
  const p = props.find((x) => x.id === selectedId) ?? props[0]
  if (!p) return null

  const txs = [...p.transactions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
        {props.map((x) => (
          <button
            key={x.id}
            onClick={() => setSelectedId(x.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              x.id === p.id
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {x.name}
            <span
              className={`ml-1.5 text-xs ${x.id === p.id ? 'text-sky-200' : 'text-slate-600'}`}
            >
              {x.transactions.length}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Link
          href={`/propiedades/${p.id}`}
          className="text-lg font-semibold text-white hover:text-sky-400"
        >
          {p.name}
        </Link>
        <StatusBadge status={p.status} />
        <span className="text-sm text-slate-500">
          {txs.length} movimientos · egresos{' '}
          <span className="text-red-400">{fmtUsd(investedUsd(p))}</span> · ingresos{' '}
          <span className="text-emerald-400">{fmtUsd(incomeUsd(p))}</span>
        </span>
      </div>

      {txs.length === 0 ? (
        <p className="text-sm text-slate-500">Sin movimientos.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Fecha</th>
                <th className="px-4 py-2.5 font-medium">Categoría</th>
                <th className="px-4 py-2.5 font-medium">Concepto</th>
                <th className="px-4 py-2.5 text-right font-medium">USD</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-t border-slate-800">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-400">{fmtDate(t.date)}</td>
                  <td className="px-4 py-2.5">{CATEGORY_LABELS[t.category]}</td>
                  <td className="max-w-md truncate px-4 py-2.5 text-slate-400">{t.notes}</td>
                  <td
                    className={`whitespace-nowrap px-4 py-2.5 text-right font-medium ${
                      t.direction === 'INGRESO' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {t.direction === 'INGRESO' ? '+' : '−'}
                    {fmtUsdExact(t.amountUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
