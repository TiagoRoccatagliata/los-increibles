import Link from 'next/link'
import { getPortfolio } from '@/lib/portfolio'
import { investedUsd, profitUsd, roi, currentValueUsd } from '@/lib/metrics'
import { fmtDate, fmtPct, fmtUsd, TYPE_LABELS } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'
import ValuationBadge from '@/components/ui/ValuationBadge'

export const dynamic = 'force-dynamic'

export default async function PropiedadesPage() {
  const props = await getPortfolio()

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Propiedades</h1>

      {props.length === 0 ? (
        <p className="text-slate-400">No hay propiedades: tocá Sincronizar para traerlas del sheet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Propiedad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Compra</th>
                <th className="px-4 py-3 text-right font-medium">Invertido</th>
                <th className="px-4 py-3 text-right font-medium">Valor actual</th>
                <th className="px-4 py-3 text-right font-medium">Ganancia</th>
                <th className="px-4 py-3 text-right font-medium">ROI</th>
              </tr>
            </thead>
            <tbody>
              {props.map((p) => {
                const profit = profitUsd(p)
                return (
                  <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                    <td className="px-4 py-3">
                      <Link href={`/propiedades/${p.id}`} className="font-medium text-white hover:text-sky-400">
                        {p.name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {TYPE_LABELS[p.type]} · {p.city}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={p.status} />
                        <ValuationBadge p={p} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{fmtDate(p.purchaseDate)}</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(investedUsd(p))}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'VENDIDA' ? '—' : fmtUsd(currentValueUsd(p))}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmtUsd(profit)}
                    </td>
                    <td className={`px-4 py-3 text-right ${roi(p) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmtPct(roi(p))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
