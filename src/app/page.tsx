import Link from 'next/link'
import { getPortfolio } from '@/lib/portfolio'
import { portfolioEvolution, portfolioSummary } from '@/lib/metrics'
import { cajaBalance, getCaja, getLastSync } from '@/lib/consorcio'
import { fmtUsd, STATUS_LABELS } from '@/lib/format'
import EvolutionChart from '@/components/charts/EvolutionChart'
import StatusBadge from '@/components/ui/StatusBadge'

export const dynamic = 'force-dynamic'

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const [props, caja, lastSync] = await Promise.all([getPortfolio(), getCaja(), getLastSync()])
  const s = portfolioSummary(props)
  const evolution = portfolioEvolution(props.filter((p) => p.status !== 'VENDIDA'))

  if (props.length === 0) {
    return (
      <main className="py-20 text-center">
        <h1 className="text-2xl font-bold">Bienvenido a Los Increíbles</h1>
        <p className="mt-2 text-slate-400">
          Tocá <span className="font-semibold text-white">⟳ Sincronizar</span> (arriba a la
          derecha) para traer los datos del Google Sheet del consorcio.
        </p>
      </main>
    )
  }

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {lastSync && (
          <p className="text-xs text-slate-500">
            Última sincronización:{' '}
            {new Intl.DateTimeFormat('es-AR', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'America/Argentina/Buenos_Aires',
            }).format(new Date(lastSync.syncedAt))}
            {lastSync.ok ? '' : ' (falló)'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Egresos totales" value={fmtUsd(s.totalInvested)} />
        <Kpi label="Valor en cartera" value={fmtUsd(s.currentValue)} />
        <Kpi label="Ganancia realizada" value={fmtUsd(s.realizedProfit)} accent={s.realizedProfit > 0} />
        <Kpi label="Ganancia proyectada" value={fmtUsd(s.projectedProfit)} accent={s.projectedProfit > 0} />
        <Kpi label="Saldo de caja" value={fmtUsd(cajaBalance(caja))} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">
            Evolución del portfolio en cartera (USD)
          </h2>
          <EvolutionChart data={evolution} height={280} />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Propiedades por estado</h2>
          <ul className="space-y-3">
            {Object.entries(STATUS_LABELS).map(([status]) => (
              <li key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-lg font-semibold text-white">{s.byStatus[status] ?? 0}</span>
              </li>
            ))}
          </ul>
          <Link href="/informes" className="mt-6 inline-block text-sm text-sky-400 hover:underline">
            Ver informes →
          </Link>
        </div>
      </div>
    </main>
  )
}
