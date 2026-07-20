import Link from 'next/link'

const REPORTS = [
  {
    href: '/informes/rentabilidad',
    title: 'Rentabilidad',
    desc: 'ROI total y anualizado por propiedad, realizado y proyectado.',
  },
  {
    href: '/informes/flujo-de-caja',
    title: 'Flujo de caja',
    desc: 'Ingresos y egresos mes a mes, con filtro por propiedad.',
  },
  {
    href: '/informes/evolucion',
    title: 'Evolución del portfolio',
    desc: 'Valor estimado del patrimonio en el tiempo, apilado por propiedad.',
  },
  {
    href: '/informes/comparacion',
    title: 'Comparación',
    desc: 'Inversión vs. ganancia y ranking para decidir dónde repetir.',
  },
]

export default function InformesPage() {
  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Informes</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition-colors hover:border-sky-700"
          >
            <h2 className="text-lg font-semibold text-white">{r.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{r.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
