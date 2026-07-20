import { getPortfolio } from '@/lib/portfolio'
import { currentValueUsd, investedUsd, portfolioEvolution } from '@/lib/metrics'
import { fmtDate, fmtUsd } from '@/lib/format'
import EvolutionChart from '@/components/charts/EvolutionChart'
import StatusBadge from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function EvolucionPage() {
  const props = await getPortfolio()
  const active = props.filter((p) => p.status !== 'VENDIDA')
  const evolution = portfolioEvolution(active)

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Evolución del portfolio</h1>
      <p className="mb-6 text-sm text-slate-400">
        Valor estimado mes a mes de las propiedades en cartera, según la última valuación
        disponible en cada momento. Las vendidas salen de la serie al momento de la venta.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <EvolutionChart data={evolution} height={360} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Propiedad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Última valuación</th>
              <th className="px-4 py-3 text-right font-medium">Invertido</th>
              <th className="px-4 py-3 text-right font-medium">Valor estimado</th>
              <th className="px-4 py-3 text-right font-medium">Apreciación</th>
            </tr>
          </thead>
          <tbody>
            {active.map((p) => {
              const lastVal = p.valuations[p.valuations.length - 1]
              const value = currentValueUsd(p)
              const appreciation = value - p.purchasePriceUsd
              return (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-slate-400">
                    {lastVal ? `${fmtDate(lastVal.date)}${lastVal.source ? ` (${lastVal.source})` : ''}` : 'Sin valuaciones'}
                  </td>
                  <td className="px-4 py-3 text-right">{fmtUsd(investedUsd(p))}</td>
                  <td className="px-4 py-3 text-right">{fmtUsd(value)}</td>
                  <td className={`px-4 py-3 text-right ${appreciation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtUsd(appreciation)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}
