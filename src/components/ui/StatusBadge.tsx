import { STATUS_COLORS, STATUS_LABELS } from '@/lib/format'

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        STATUS_COLORS[status] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
