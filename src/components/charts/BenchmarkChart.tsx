'use client'

import { useMemo, useState } from 'react'
import * as d3 from 'd3'
import { useSize } from './useSize'
import Tooltip from './Tooltip'
import { INK, SERIES } from './theme'
import { fmtUsd } from '@/lib/format'
import type { BenchmarkPoint } from '@/lib/benchmark'

const fmtMonth = (m: string) => {
  const [y, mm] = m.split('-')
  return new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(y), Number(mm) - 1, 15)))
}

/** Líneas comparadas: valor real del consorcio vs. alternativas de inversión */
export default function BenchmarkChart({
  data,
  height = 340,
}: {
  data: BenchmarkPoint[]
  height?: number
}) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null)

  const keys = useMemo(() => (data.length ? Object.keys(data[0].series) : []), [data])

  if (width === 0 || data.length === 0)
    return <div ref={ref} style={{ height }} className="w-full" />

  const margin = { top: 12, right: 12, bottom: 28, left: 70 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const x = d3.scalePoint().domain(data.map((d) => d.month)).range([0, innerW])
  const maxV = d3.max(data, (d) => d3.max(keys, (k) => d.series[k])) ?? 1
  const y = d3.scaleLinear().domain([0, maxV]).nice().range([innerH, 0])

  const tickEvery = Math.ceil(data.length / Math.max(1, Math.floor(innerW / 70)))
  const hoverRow = hover ? data[hover.i] : null

  return (
    <div ref={ref} className="relative w-full">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {keys.map((k, i) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ background: SERIES[i], height: k === 'Consorcio' ? 3 : 2 }}
            />
            {k}
          </span>
        ))}
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Consorcio vs. alternativas de inversión"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - r.left - margin.left
          const i = Math.max(
            0,
            Math.min(data.length - 1, Math.round((px / innerW) * (data.length - 1))),
          )
          setHover({ i, x: e.clientX - r.left, y: e.clientY - r.top })
        }}
        onMouseLeave={() => setHover(null)}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {y.ticks(5).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke={INK.grid} strokeWidth={1} />
              <text x={-8} textAnchor="end" dominantBaseline="middle" fill={INK.muted} fontSize={11}>
                {fmtUsd(t)}
              </text>
            </g>
          ))}
          {keys.map((k, ki) => {
            const line = d3
              .line<BenchmarkPoint>()
              .x((d) => x(d.month)!)
              .y((d) => y(d.series[k]))
              .curve(d3.curveMonotoneX)
            return (
              <path
                key={k}
                d={line(data) ?? undefined}
                fill="none"
                stroke={SERIES[ki]}
                strokeWidth={k === 'Consorcio' ? 3 : 1.5}
                strokeDasharray={k === 'Consorcio' ? undefined : '5 4'}
                pointerEvents="none"
              />
            )
          })}
          {data.map(
            (d, i) =>
              i % tickEvery === 0 && (
                <text
                  key={d.month}
                  x={x(d.month)}
                  y={innerH + 18}
                  textAnchor="middle"
                  fill={INK.muted}
                  fontSize={11}
                >
                  {fmtMonth(d.month)}
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
          {keys.map((k, i) => (
            <div key={k} className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-sm" style={{ background: SERIES[i] }} />
              {k}: {fmtUsd(hoverRow.series[k])}
            </div>
          ))}
        </Tooltip>
      )}
    </div>
  )
}
