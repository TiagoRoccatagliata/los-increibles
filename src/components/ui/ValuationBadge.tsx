import { valuationAgeDays, type PlainProperty } from '@/lib/metrics'

/** Frescura de la valuación: sin valuar (rojo), vieja > 4 meses (ámbar), al día (verde) */
export default function ValuationBadge({ p }: { p: PlainProperty }) {
  if (p.status === 'VENDIDA') return null
  const days = valuationAgeDays(p)
  const cls = 'rounded-full border px-2 py-0.5 text-xs font-medium'
  if (days === null)
    return (
      <span
        className={`${cls} border-red-500/40 bg-red-500/20 text-red-300`}
        title="Sin valuación cargada: los análisis usan el precio de publicación o compra"
      >
        Sin valuar
      </span>
    )
  const months = Math.floor(days / 30)
  if (days > 120)
    return (
      <span
        className={`${cls} border-amber-500/40 bg-amber-500/20 text-amber-300`}
        title="Conviene revisar publicaciones de la zona y actualizar el valor"
      >
        Valuación de hace {months} meses
      </span>
    )
  return (
    <span className={`${cls} border-emerald-500/40 bg-emerald-500/20 text-emerald-300`}>
      Valuada {days < 30 ? 'hace menos de un mes' : `hace ${months} ${months === 1 ? 'mes' : 'meses'}`}
    </span>
  )
}
