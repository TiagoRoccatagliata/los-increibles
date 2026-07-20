import { getPortfolio } from '@/lib/portfolio'
import { annualizedRoi, holdingDays, investedUsd, profitUsd, roi } from '@/lib/metrics'
import { fmtPct, fmtUsd } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'
import CompareScatter from '@/components/charts/CompareScatter'

export const dynamic = 'force-dynamic'

export default async function ComparacionPage() {
  const props = await getPortfolio()
  const data = props.map((p) => ({
    p,
    invested: investedUsd(p),
    profit: profitUsd(p),
    roi: roi(p),
    roiAnnual: annualizedRoi(p),
    days: holdingDays(p),
    sold: p.status === 'VENDIDA',
  }))
  const ranked = [...data].sort((a, b) => b.roiAnnual - a.roiAnnual)

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Comparación entre propiedades</h1>
      <p className="mb-6 text-sm text-slate-400">
        Qué operaciones rindieron mejor por capital y por tiempo: útil para decidir qué tipo de
        propiedad y zona repetir.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Inversión vs. ganancia</h2>
        <CompareScatter
          data={data.map((d) => ({
            name: d.p.name,
            invested: d.invested,
            profit: d.profit,
            roiAnnual: d.roiAnnual,
            days: d.days,
            sold: d.sold,
          }))}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Propiedad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Invertido</th>
              <th className="px-4 py-3 text-right font-medium">Ganancia</th>
              <th className="px-4 py-3 text-right font-medium">ROI anualizado</th>
              <th className="px-4 py-3 text-right font-medium">Ganancia / mes</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((d, i) => (
              <tr key={d.p.id} className="border-t border-slate-800">
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-white">{d.p.name}</td>
                <td className="px-4 py-3"><StatusBadge status={d.p.status} /></td>
                <td className="px-4 py-3 text-right">{fmtUsd(d.invested)}</td>
                <td className={`px-4 py-3 text-right ${d.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtUsd(d.profit)}
                </td>
                <td className="px-4 py-3 text-right">{fmtPct(d.roiAnnual)}</td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {fmtUsd(d.profit / Math.max(1, d.days / 30.44))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
