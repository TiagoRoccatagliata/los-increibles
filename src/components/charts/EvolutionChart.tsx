'use client'

import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { useSize } from './useSize'
import Tooltip from './Tooltip'
import { INK, SERIES } from './theme'
import { fmtUsd } from '@/lib/format'
import type { EvolutionPoint } from '@/lib/metrics'

const fmtMonth = (m: string) => {
  const [y, mm] = m.split('-')
  return new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(y), Number(mm) - 1, 15)))
}

const MAX_SERIES = 8

/** Área apilada del valor del portfolio por propiedad, mes a mes */
export default function EvolutionChart({
  data,
  height = 320,
  compact = false,
}: {
  data: EvolutionPoint[]
  height?: number
  compact?: boolean
}) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null)

  // Series en orden fijo de aparición; más allá de 8 se agrupan en "Otras"
  const keys = useMemo(() => {
    const seen: string[] = []
    for (const pt of data)
      for (const k of Object.keys(pt.values)) if (!seen.includes(k)) seen.push(k)
    return seen
  }, [data])

  const shownKeys = useMemo(
    () => (keys.length > MAX_SERIES ? [...keys.slice(0, MAX_SERIES - 1), 'Otras'] : keys),
    [keys],
  )

  const rows = useMemo(
    () =>
      data.map((pt) => {
        const row: Record<string, number> = {}
        for (const k of shownKeys) row[k] = 0
        for (const [k, v] of Object.entries(pt.values)) {
          const key = shownKeys.includes(k) ? k : 'Otras'
          row[key] = (row[key] ?? 0) + v
        }
        return { month: pt.month, total: pt.total, ...row }
      }),
    [data, shownKeys],
  )

  if (width === 0 || data.length === 0)
    return <div ref={ref} style={{ height }} className="w-full" />

  const margin = { top: 12, right: 12, bottom: compact ? 20 : 28, left: compact ? 56 : 70 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const x = d3.scalePoint().domain(rows.map((r) => r.month)).range([0, innerW])
  const maxTotal = d3.max(rows, (r) => r.total) ?? 1
  const y = d3.scaleLinear().domain([0, maxTotal]).nice().range([innerH, 0])

  type Row = { month: string; total: number } & Record<string, number | string>
  const stack = d3
    .stack<Row>()
    .keys(shownKeys)
    .value((d, k) => (d[k] as number) ?? 0)
  const layers = stack(rows as Row[])
  const area = d3
    .area<d3.SeriesPoint<Row>>()
    .x((d) => x(d.data.month)!)
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(d3.curveMonotoneX)

  const tickEvery = Math.ceil(rows.length / Math.max(1, Math.floor(innerW / 70)))
  const hoverRow = hover ? rows[hover.i] : null

  return (
    <div ref={ref} className="relative w-full">
      {!compact && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {shownKeys.map((k, i) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[i] }} />
              {k}
            </span>
          ))}
        </div>
      )}
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Evolución del valor del portfolio"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - r.left - margin.left
          const i = Math.max(
            0,
            Math.min(rows.length - 1, Math.round((px / innerW) * (rows.length - 1))),
          )
          setHover({ i, x: e.clientX - r.left, y: e.clientY - r.top })
        }}
        onMouseLeave={() => setHover(null)}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {y.ticks(compact ? 3 : 5).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke={INK.grid} strokeWidth={1} />
              <text x={-8} textAnchor="end" dominantBaseline="middle" fill={INK.muted} fontSize={11}>
                {fmtUsd(t)}
              </text>
            </g>
          ))}
          {layers.map((layer, i) => (
            <path
              key={layer.key}
              d={area(layer) ?? undefined}
              fill={SERIES[i]}
              stroke={INK.surface}
              strokeWidth={2}
              pointerEvents="none"
            />
          ))}
          {rows.map(
            (r, i) =>
              i % tickEvery === 0 && (
                <text
                  key={r.month}
                  x={x(r.month)}
                  y={innerH + 18}
                  textAnchor="middle"
                  fill={INK.muted}
                  fontSize={11}
                >
                  {fmtMonth(r.month)}
                </text>
              ),
          )}
          {hoverRow && (
            <line
              x1={x(hoverRow.month)}
              x2={x(hoverRow.month)}
              y2={innerH}
              stroke={INK.secondary}
              strokeWidth={1}
              strokeDasharray="3 3"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
      {hover && hoverRow && (
        <Tooltip x={hover.x} y={hover.y} width={width}>
          <div className="font-semibold text-white">{fmtMonth(hoverRow.month)}</div>
          <div className="mt-1 font-medium text-slate-200">Total: {fmtUsd(hoverRow.total)}</div>
          {shownKeys.map(
            (k, i) =>
              ((hoverRow as unknown) as Record<string, number>)[k] > 0 && (
                <div key={k} className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-sm" style={{ background: SERIES[i] }} />
                  {k}: {fmtUsd(((hoverRow as unknown) as Record<string, number>)[k])}
                </div>
              ),
          )}
        </Tooltip>
      )}
    </div>
  )
}
