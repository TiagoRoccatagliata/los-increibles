import { cajaBalance, getCaja } from '@/lib/consorcio'
import { fmtDate, fmtUsd, fmtUsdExact } from '@/lib/format'
import CajaChart from '@/components/charts/CajaChart'

export const dynamic = 'force-dynamic'

export default async function CajaPage() {
  const movs = await getCaja()
  const balance = cajaBalance(movs)

  const points = movs.reduce<{ date: string; concept: string; delta: number; balance: number }[]>(
    (acc, m) => {
      const delta = m.inUsd - m.outUsd
      const prev = acc.length ? acc[acc.length - 1].balance : 0
      acc.push({ date: m.date, concept: m.concept, delta, balance: prev + delta })
      return acc
    },
    [],
  )

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Caja del consorcio</h1>
      <p className="mb-6 text-sm text-slate-400">
        Saldo actual:{' '}
        <span className={`font-semibold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {fmtUsd(balance)}
        </span>
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Evolución del saldo (USD)</h2>
        <CajaChart data={points} />
      </div>

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
