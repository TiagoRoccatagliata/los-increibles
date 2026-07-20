import { notFound } from 'next/navigation'
import { getPortfolio } from '@/lib/portfolio'
import {
  investedUsd,
  incomeUsd,
  currentValueUsd,
  profitUsd,
  roi,
  annualizedRoi,
  holdingDays,
} from '@/lib/metrics'
import { CATEGORY_LABELS, fmtDate, fmtPct, fmtUsd, fmtUsdExact, TYPE_LABELS } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'pos' | 'neg' }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`mt-1 text-lg font-semibold ${
          accent === 'pos' ? 'text-emerald-400' : accent === 'neg' ? 'text-red-400' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export default async function PropiedadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const props = await getPortfolio()
  const p = props.find((x) => x.id === id)
  if (!p) notFound()

  const invested = investedUsd(p)
  const profit = profitUsd(p)

  return (
    <main>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <StatusBadge status={p.status} />
      </div>
      <p className="text-sm text-slate-400">
        {TYPE_LABELS[p.type]} · {p.city}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Stat label="Compra" value={fmtUsd(p.purchasePriceUsd)} />
        <Stat label="Egresos totales" value={fmtUsd(invested)} />
        <Stat label="Ingresos" value={fmtUsd(incomeUsd(p))} />
        <Stat
          label={p.status === 'VENDIDA' ? 'Precio de venta' : 'Valor estimado'}
          value={fmtUsd(p.status === 'VENDIDA' ? (p.salePriceUsd ?? 0) : currentValueUsd(p))}
        />
        <Stat
          label={p.status === 'VENDIDA' ? 'Ganancia realizada' : 'Ganancia proyectada'}
          value={fmtUsd(profit)}
          accent={profit >= 0 ? 'pos' : 'neg'}
        />
        <Stat
          label={`ROI (${holdingDays(p)} días)`}
          value={`${fmtPct(roi(p))} · ${fmtPct(annualizedRoi(p))} anual`}
          accent={roi(p) >= 0 ? 'pos' : 'neg'}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Movimientos ({p.transactions.length})</h2>
        {p.transactions.length === 0 ? (
          <p className="text-sm text-slate-500">Sin movimientos. Tocá Sincronizar para traerlos del sheet.</p>
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
                {p.transactions.map((t) => (
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
      </section>
    </main>
  )
}
