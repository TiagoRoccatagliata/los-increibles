import Link from 'next/link'
import { cajaBalance, getCaja } from '@/lib/consorcio'
import { getPortfolio } from '@/lib/portfolio'
import { cajaHealth, holdingCostRanking } from '@/lib/decisiones'
import { fmtDate, fmtUsd, fmtUsdExact } from '@/lib/format'
import CajaChart from '@/components/charts/CajaChart'

export const dynamic = 'force-dynamic'

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold ${
          tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export default async function CajaPage() {
  const [movs, props] = await Promise.all([getCaja(), getPortfolio()])
  const balance = cajaBalance(movs)
  const health = cajaHealth(movs)
  const ranking = holdingCostRanking(props).filter((r) => r.monthlyUsd > 0)

  const points = movs.reduce<{ date: string; concept: string; delta: number; balance: number }[]>(
    (acc, m) => {
      const delta = m.inUsd - m.outUsd
      const prev = acc.length ? acc[acc.length - 1].balance : 0
      acc.push({ date: m.date, concept: m.concept, delta, balance: prev + delta })
      return acc
    },
    [],
  )
  // Proyección a 12 meses al ritmo de gastos actual, dibujada a continuación
  const chartData = [
    ...points,
    ...health.projection.map((p) => ({
      date: p.month + '-15',
      concept: 'Proyección al ritmo de gastos actual',
      delta: -health.monthlyBurnUsd,
      balance: Math.max(0, p.balance),
    })),
  ]

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Caja del consorcio</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Saldo actual" value={fmtUsd(balance)} tone={balance >= 0 ? undefined : 'neg'} />
        <Kpi
          label="Gasto neto promedio / mes"
          value={
            health.monthlyBurnUsd > 0 ? fmtUsd(health.monthlyBurnUsd) : fmtUsd(-health.monthlyBurnUsd)
          }
          tone={health.monthlyBurnUsd > 0 ? 'neg' : 'pos'}
        />
        <Kpi
          label="La caja cubre"
          value={
            health.runwayMonths === null
              ? 'No se achica'
              : `~${health.runwayMonths.toFixed(1)} meses`
          }
          tone={
            health.runwayMonths === null ? 'pos' : health.runwayMonths < 3 ? 'neg' : undefined
          }
        />
        <Kpi
          label="Saldo proyectado en 12 meses"
          value={fmtUsd(health.projection[health.projection.length - 1]?.balance ?? balance)}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        El gasto promedio sale de los últimos 6 meses de movimientos de caja (sin contar aportes ni
        ventas grandes). Si la caja cubre menos de 3 meses, conviene planear un aporte o una venta.
      </p>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">
          Evolución del saldo + proyección a 12 meses (USD)
        </h2>
        <CajaChart data={chartData} />
      </div>

      {ranking.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">¿Qué propiedad quema más por mes?</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Propiedad</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Expensas + impuestos + servicios / mes
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Por año</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="px-4 py-3">
                      <Link
                        href={`/propiedades/${r.id}`}
                        className="font-medium text-white hover:text-sky-400"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">{fmtUsd(r.monthlyUsd)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {fmtUsd(r.monthlyUsd * 12)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Concepto</th>
              <th className="px-4 py-3 text-right font-medium">Entrada</th>
              <th className="px-4 py-3 text-right font-medium">Salida</th>
              <th className="px-4 py-3 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p, i) => (
              <tr key={i} className="border-t border-slate-800">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-400">{fmtDate(p.date)}</td>
                <td className="max-w-md truncate px-4 py-2.5">{p.concept}</td>
                <td className="px-4 py-2.5 text-right text-emerald-400">
                  {p.delta > 0 ? fmtUsdExact(p.delta) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right text-red-400">
                  {p.delta < 0 ? fmtUsdExact(-p.delta) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-white">{fmtUsdExact(p.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
