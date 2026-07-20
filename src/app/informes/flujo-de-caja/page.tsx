import { getPortfolio } from '@/lib/portfolio'
import CashflowReport from '@/components/CashflowReport'

export const dynamic = 'force-dynamic'

export default async function FlujoDeCajaPage() {
  const props = await getPortfolio()

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Flujo de caja</h1>
      <p className="mb-6 text-sm text-slate-400">
        Ingresos y egresos por mes, normalizados a USD con el tipo de cambio de cada movimiento.
      </p>
      <CashflowReport properties={props} />
    </main>
  )
}
