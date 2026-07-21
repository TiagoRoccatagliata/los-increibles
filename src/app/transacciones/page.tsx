import { getPortfolio } from '@/lib/portfolio'
import TransactionsTabs from '@/components/TransactionsTabs'

export const dynamic = 'force-dynamic'

export default async function TransaccionesPage() {
  const props = await getPortfolio()
  const total = props.reduce((s, p) => s + p.transactions.length, 0)

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Transacciones</h1>
      <p className="mb-6 text-sm text-slate-400">
        Todos los movimientos sincronizados desde el sheet ({total}), por unidad.
      </p>
      {props.length === 0 ? (
        <p className="text-slate-400">No hay propiedades: tocá Sincronizar para traerlas del sheet.</p>
      ) : (
        <TransactionsTabs props={props} />
      )}
    </main>
  )
}
