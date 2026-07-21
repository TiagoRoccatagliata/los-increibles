import Link from 'next/link'
import { cajaBalance, getCaja, getLiquidations, getMembers } from '@/lib/consorcio'
import { getPortfolio } from '@/lib/portfolio'
import { consortiumNav, memberPositions } from '@/lib/decisiones'
import { valuationAgeDays } from '@/lib/metrics'
import { fmtDate, fmtPct, fmtUsd, fmtUsdExact } from '@/lib/format'
import ContributionsChart from '@/components/charts/ContributionsChart'

export const dynamic = 'force-dynamic'

export default async function SociosPage() {
  const [members, liquidations, props, caja] = await Promise.all([
    getMembers(),
    getLiquidations(),
    getPortfolio(),
    getCaja(),
  ])
  const total = members.reduce((s, m) => s + m.contributionsUsd, 0)
  const balance = cajaBalance(caja)
  const nav = consortiumNav(props, balance)
  const positions = memberPositions(members, props, balance)
  const unvalued = props.filter((p) => p.status !== 'VENDIDA' && valuationAgeDays(p) === null)

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Socios del consorcio</h1>
      <p className="mb-6 text-sm text-slate-400">
        Aportes totales: <span className="font-semibold text-white">{fmtUsd(total)}</span>
      </p>

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-semibold">¿Cómo está parado cada uno?</h2>
        <p className="mb-3 text-sm text-slate-500">
          Si hoy se vendiera todo a valor de mercado (menos ~4% de gastos de venta) y se repartiera
          la caja, el consorcio vale{' '}
          <span className="font-semibold text-white">{fmtUsd(nav)}</span>.
          {unvalued.length > 0 && (
            <span className="text-amber-400">
              {' '}
              Ojo: {unvalued.length === 1 ? 'una propiedad está' : `${unvalued.length} propiedades están`} sin
              valuar (se usa el precio de compra), así que este número es conservador —{' '}
              <Link href="/propiedades" className="underline">
                cargá las valuaciones
              </Link>
              .
            </span>
          )}
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Socio</th>
                <th className="px-4 py-3 text-right font-medium">Aportó</th>
                <th className="px-4 py-3 text-right font-medium">Ya retiró</th>
                <th className="px-4 py-3 text-right font-medium">Le corresponde hoy</th>
                <th className="px-4 py-3 text-right font-medium">Ganancia</th>
                <th className="px-4 py-3 text-right font-medium">ROI personal</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.name} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium text-white">
                    {pos.name}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({pos.sharePct.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{fmtUsd(pos.contributedUsd)}</td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {pos.withdrawnUsd > 0 ? fmtUsd(pos.withdrawnUsd) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {fmtUsd(pos.entitledUsd)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      pos.profitUsd >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {fmtUsd(pos.profitUsd)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${
                      pos.personalRoi >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {fmtPct(pos.personalRoi)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Aportes por socio (USD)</h2>
          <ContributionsChart
            data={members.map((m) => ({
              name: m.name,
              amount: m.contributionsUsd,
              pct: m.sharePct,
            }))}
          />
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Socio</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 text-right font-medium">Aportes</th>
                <th className="px-4 py-3 text-right font-medium">Participación</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium text-white">{m.name}</td>
                  <td className="px-4 py-3 text-slate-400">{m.category}</td>
                  <td className="px-4 py-3 text-right">{fmtUsdExact(m.contributionsUsd)}</td>
                  <td className="px-4 py-3 text-right">{m.sharePct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Liquidaciones</h2>
        {liquidations.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no hay liquidaciones registradas en el sheet. Cuando carguen la primera en la
            pestaña LIQUIDACIONES, va a aparecer acá con el detalle por socio.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  {members.map((m) => (
                    <th key={m.id} className="px-4 py-3 text-right font-medium">{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liquidations.map((l) => (
                  <tr key={l.id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-slate-400">{fmtDate(l.date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{fmtUsd(l.totalUsd)}</td>
                    {members.map((m) => (
                      <td key={m.id} className="px-4 py-3 text-right">
                        {l.shares[m.name] ? fmtUsd(l.shares[m.name]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Movimientos por socio</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {members.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">{m.name}</h3>
              {m.movements.length === 0 ? (
                <p className="text-sm text-slate-500">Sin movimientos.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {m.movements.slice(0, 8).map((mv) => (
                      <tr key={mv.id} className="border-t border-slate-800/60 first:border-0">
                        <td className="whitespace-nowrap py-1.5 pr-3 text-xs text-slate-500">
                          {fmtDate(mv.date)}
                        </td>
                        <td className="max-w-56 truncate py-1.5 pr-3 text-slate-300">{mv.concept}</td>
                        <td
                          className={`whitespace-nowrap py-1.5 text-right font-medium ${
                            mv.inUsd > 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {mv.inUsd > 0 ? `+${fmtUsdExact(mv.inUsd)}` : `−${fmtUsdExact(mv.outUsd)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {m.movements.length > 8 && (
                <p className="mt-2 text-xs text-slate-600">
                  … y {m.movements.length - 8} movimientos más en el sheet.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
