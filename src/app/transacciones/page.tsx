import Link from 'next/link'
import { getPortfolio } from '@/lib/portfolio'
import { CATEGORY_LABELS, fmtDate, fmtUsdExact } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function TransaccionesPage() {
  const props = await getPortfolio()
  const all = props
    .flatMap((p) => p.transactions.map((t) => ({ ...t, propertyName: p.name })))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold">Transacciones</h1>
      <p className="mb-6 text-sm text-slate-400">
        Todos los movimientos por propiedad, sincronizados desde el sheet ({all.length}).
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-slate-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Fecha</th>
              <th className="px-4 py-2.5 font-medium">Propiedad</th>
              <th className="px-4 py-2.5 font-medium">Categoría</th>
              <th className="px-4 py-2.5 font-medium">Concepto</th>
              <th className="px-4 py-2.5 text-right font-medium">USD</th>
            </tr>
          </thead>
          <tbody>
            {all.map((t) => (
              <tr key={t.id} className="border-t border-slate-800">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-400">{fmtDate(t.date)}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <Link href={`/propiedades/${t.propertyId}`} className="hover:text-sky-400">
                    {t.propertyName}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{CATEGORY_LABELS[t.category]}</td>
                <td className="max-w-md truncate px-4 py-2.5 text-slate-400">{t.notes}</td>
                <td
                  className={`whitespace-nowrap px-4 py-2.5 text-right font-medium ${
                    t.direction === 'INGRESO' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {t.direction === 'INGRESO' ? '+' : '−'}
                  {fmtUsdExact(t.amountUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
