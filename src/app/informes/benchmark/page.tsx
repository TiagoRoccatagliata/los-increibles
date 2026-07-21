import Link from 'next/link'
import { cajaBalance, getCaja, getMembers } from '@/lib/consorcio'
import { getPortfolio } from '@/lib/portfolio'
import { consortiumNav } from '@/lib/decisiones'
import { valuationAgeDays } from '@/lib/metrics'
import {
  BENCHMARKS,
  benchmarkSeries,
  contributionCashflows,
  moneyWeightedAnnualRate,
} from '@/lib/benchmark'
import { fmtPct, fmtUsd } from '@/lib/format'
import BenchmarkChart from '@/components/charts/BenchmarkChart'

export const dynamic = 'force-dynamic'

export default async function BenchmarkPage() {
  const [props, members, caja] = await Promise.all([getPortfolio(), getMembers(), getCaja()])
  const cashflows = contributionCashflows(members)
  const balance = cajaBalance(caja)
  // Sin costos de salida acá: se compara valor bruto contra alternativas brutas
  const currentValue = consortiumNav(props, balance, 0)
  const irr = moneyWeightedAnnualRate(cashflows, currentValue)
  const series = benchmarkSeries(cashflows, props, caja)
  const last = series[series.length - 1]
  const unvalued = props.filter((p) => p.status !== 'VENDIDA' && valuationAgeDays(p) === null)

  const verdicts = BENCHMARKS.map((b) => {
    const altToday = last?.series[b.key] ?? 0
    return {
      ...b,
      altToday,
      diffUsd: currentValue - altToday,
      diffRate: irr !== null ? irr - b.rate : null,
    }
  })

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">¿Está rindiendo la inversión?</h1>
      <p className="mb-6 max-w-3xl text-sm text-slate-400">
        Tomamos cada aporte que hicieron los socios, en su fecha real, y simulamos qué habría
        pasado si esa misma plata hubiera ido a otra inversión en USD. La línea sólida es el
        consorcio (propiedades a valor estimado + caja).
      </p>

      {unvalued.length > 0 && (
        <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          {unvalued.length === 1 ? 'Hay una propiedad sin valuar' : `Hay ${unvalued.length} propiedades sin valuar`}{' '}
          (se usa su precio de compra), así que el valor real puede estar subestimado:{' '}
          {unvalued.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ', '}
              <Link href={`/propiedades/${p.id}`} className="underline">
                {p.name}
              </Link>
            </span>
          ))}
          .
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <div className="text-sm text-slate-500">Rendimiento anual del consorcio (TIR)</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {irr !== null ? fmtPct(irr) : 'Sin datos de aportes'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Valor hoy: {fmtUsd(currentValue)} sobre los aportes reales de los socios
          </div>
        </div>
        {irr !== null &&
          (() => {
            const beaten = verdicts.filter((v) => v.diffRate !== null && v.diffRate > 0)
            const best = verdicts[verdicts.length - 1]
            return (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
                <div className="text-sm text-slate-500">Veredicto</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-200">
                  {beaten.length === verdicts.length
                    ? 'El consorcio le gana a todas las alternativas comparadas. 💪'
                    : beaten.length === 0
                      ? 'Hoy todas las alternativas comparadas habrían rendido más que el consorcio.'
                      : `Le gana a ${beaten.map((b) => b.key.split(' (')[0]).join(', ')}, pero ${best.key.split(' (')[0]} habría rendido más.`}
                </div>
              </div>
            )
          })()}
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">
          Los mismos aportes, en distintas inversiones (USD)
        </h2>
        <BenchmarkChart data={series} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Alternativa</th>
              <th className="px-4 py-3 text-right font-medium">Tendrían hoy</th>
              <th className="px-4 py-3 text-right font-medium">Diferencia con el consorcio</th>
              <th className="px-4 py-3 text-right font-medium">Puntos anuales</th>
            </tr>
          </thead>
          <tbody>
            {verdicts.map((v) => (
              <tr key={v.key} className="border-t border-slate-800">
                <td className="px-4 py-3 text-slate-300">{v.key}</td>
                <td className="px-4 py-3 text-right">{fmtUsd(v.altToday)}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    v.diffUsd >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {v.diffUsd >= 0 ? '+' : ''}
                  {fmtUsd(v.diffUsd)}
                </td>
                <td
                  className={`px-4 py-3 text-right ${
                    (v.diffRate ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {v.diffRate !== null ? fmtPct(v.diffRate) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Tasas de referencia aproximadas, configurables en <code>src/lib/benchmark.ts</code>. La
        comparación no incluye impuestos ni el valor de uso de las propiedades.
      </p>
    </main>
  )
}
