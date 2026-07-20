export const fmtUsd = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

export const fmtUsdExact = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(n)

export const fmtArs = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)

export const fmtPct = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(n)

export const fmtDate = (d: Date | string) =>
  new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    typeof d === 'string' ? new Date(d) : d,
  )

export const STATUS_LABELS: Record<string, string> = {
  COMPRADA: 'Comprada',
  EN_OBRA: 'En obra',
  EN_VENTA: 'En venta',
  VENDIDA: 'Vendida',
}

export const STATUS_COLORS: Record<string, string> = {
  COMPRADA: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  EN_OBRA: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  EN_VENTA: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  VENDIDA: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
}

export const TYPE_LABELS: Record<string, string> = {
  DEPARTAMENTO: 'Departamento',
  CASA: 'Casa',
  LOCAL: 'Local',
  TERRENO: 'Terreno',
  OTRO: 'Otro',
}

export const CATEGORY_LABELS: Record<string, string> = {
  COMPRA: 'Compra',
  ESCRITURA: 'Escritura',
  COMISION: 'Comisión',
  REFACCION: 'Refacción',
  IMPUESTOS: 'Impuestos',
  SERVICIOS: 'Servicios',
  EXPENSAS: 'Expensas',
  VENTA: 'Venta',
  OTRO: 'Otro',
}
