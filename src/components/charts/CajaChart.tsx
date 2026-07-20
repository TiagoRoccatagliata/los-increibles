'use client'

import { useState } from 'react'
import * as d3 from 'd3'
import { useSize } from './useSize'
import Tooltip from './Tooltip'
import { INK, SERIES } from './theme'
import { fmtDate, fmtUsd } from '@/lib/format'

export type CajaPoint = { date: string; concept: string; delta: number; balance: number }

/** Línea de evolución del saldo de caja, punto por movimiento */
export default function CajaChart({ data }: { data: CajaPoint[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null)

  const height = 300
  const margin = { top: 12, right: 12, bottom: 28, left: 70 }

  if (width === 0 || data.length === 0) return <div ref={ref} className="h-72 w-full" />

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
    .range([0, innerW])
  const y = d3
    .scaleLinear()
    .domain([0, (d3.max(data, (d) => d.balance) ?? 1) * 1.05])
    .nice()
    .range([innerH, 0])

  const line = d3
    .line<CajaPoint>()
    .x((d) => x(new Date(d.date)))
    .y((d) => y(d.balance))
    .curve(d3.curveStepAfter)

  const hoverPt = hover ? data[hover.i] : null

  return (
    <div ref={ref} className="relative w-full">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Evolución del saldo de caja"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - r.left - margin.left
          const t = x.invert(Math.max(0, Math.min(innerW, px))).getTime()
          let best = 0
          let bestDist = Infinity
          data.forEach((d, i) => {
            const dist = Math.abs(new Date(d.date).getTime() - t)
            if (dist < bestDist) {
              bestDist = dist
              best = i
            }
          })
          setHover({ i: best, x: e.clientX - r.left, y: e.clientY - r.top })
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
          {x.ticks(6).map((t, i) => (
            <text
              key={i}
              x={x(t)}
              y={innerH + 18}
              textAnchor="middle"
              fill={INK.muted}
              fontSize={11}
            >
              {new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' }).format(t)}
            </text>
          ))}
          <path d={line(data) ?? undefined} fill="none" stroke={SERIES[0]} strokeWidth={2} />
          {hoverPt && (
            <>
              <line
                x1={x(new Date(hoverPt.date))}
                x2={x(new Date(hoverPt.date))}
                y2={innerH}
                stroke={INK.secondary}
                strokeWidth={1}
                strokeDasharray="3 3"
                pointerEvents="none"
              />
              <circle
                cx={x(new Date(hoverPt.date))}
                cy={y(hoverPt.balance)}
                r={5}
                fill={SERIES[0]}
                stroke={INK.surface}
                strokeWidth={2}
                pointerEvents="none"
              />
            </>
          )}
        </g>
      </svg>
      {hover && hoverPt && (
        <Tooltip x={hover.x} y={hover.y} width={width}>
          <div className="font-semibold text-white">{fmtDate(hoverPt.date)}</div>
          <div className="mt-1 max-w-52 text-slate-300">{hoverPt.concept}</div>
          <div className={hoverPt.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {hoverPt.delta >= 0 ? '+' : ''}
            {fmtUsd(hoverPt.delta)}
          </div>
          <div className="text-slate-300">Saldo: {fmtUsd(hoverPt.balance)}</div>
        </Tooltip>
      )}
    </div>
  )
}
