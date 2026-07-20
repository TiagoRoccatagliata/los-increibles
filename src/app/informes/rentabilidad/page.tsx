import { getPortfolio } from '@/lib/portfolio'
import { annualizedRoi, holdingDays, investedUsd, profitUsd, roi } from '@/lib/metrics'
import { fmtPct, fmtUsd } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'
import RoiBarChart from '@/components/charts/RoiBarChart'

export const dynamic = 'force-dynamic'

export default async function RentabilidadPage() {
  const props = await getPortfolio()
  const data = props.map((p) => ({
    p,
    invested: investedUsd(p),
    profit: profitUsd(p),
    roi: roi(p),
    roiAnnual: annualizedRoi(p),
    days: holdingDays(p),
  }))
  const sorted = [...data].sort((a, b) => b.roi - a.roi)

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Rentabilidad</h1>
      <p className="mb-6 text-sm text-slate-400">
        ROI = ganancia (realizada o proyectada) sobre el total invertido. Para propiedades en
        cartera se usa la última valuación o el precio de publicación.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">ROI por propiedad</h2>
        <RoiBarChart
          data={sorted.map((d) => ({
            name: d.p.name,
            roi: d.roi,
            profit: d.profit,
            invested: d.invested,
          }))}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Propiedad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Invertido</th>
              <th className="px-4 py-3 text-right font-medium">Ganancia</th>
              <th className="px-4 py-3 text-right font-medium">ROI</th>
              <th className="px-4 py-3 text-right font-medium">ROI anualizado</th>
              <th className="px-4 py-3 text-right font-medium">Tenencia</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => (
              <tr key={d.p.id} className="border-t border-slate-800">
                <td className="px-4 py-3 font-medium text-white">{d.p.name}</td>
                <td className="px-4 py-3"><StatusBadge status={d.p.status} /></td>
                <td className="px-4 py-3 text-right">{fmtUsd(d.invested)}</td>
                <td className={`px-4 py-3 text-right ${d.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtUsd(d.profit)}
                </td>
                <td className="px-4 py-3 text-right">{fmtPct(d.roi)}</td>
                <td className="px-4 py-3 text-right">{fmtPct(d.roiAnnual)}</td>
                <td className="px-4 py-3 text-right text-slate-400">{d.days} días</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
