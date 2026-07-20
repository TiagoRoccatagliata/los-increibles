'use client'

import { useState } from 'react'
import * as d3 from 'd3'
import { useSize } from './useSize'
import Tooltip from './Tooltip'
import { DIVERGING, INK } from './theme'
import { fmtPct, fmtUsd } from '@/lib/format'

export type RoiDatum = { name: string; roi: number; profit: number; invested: number }

/** Barras horizontales de ROI por propiedad, ordenadas, con polaridad +/- */
export default function RoiBarChart({ data }: { data: RoiDatum[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<{ d: RoiDatum; x: number; y: number } | null>(null)

  const sorted = [...data].sort((a, b) => b.roi - a.roi)
  const rowH = 36
  const margin = { top: 8, right: 70, bottom: 24, left: 150 }
  const height = margin.top + margin.bottom + sorted.length * rowH

  if (width === 0 || sorted.length === 0)
    return <div ref={ref} className="h-40 w-full" />

  const innerW = width - margin.left - margin.right
  const ext = d3.max(sorted, (d) => Math.abs(d.roi)) ?? 0.1
  const x = d3.scaleLinear().domain([Math.min(0, -ext * 0.05), ext]).nice().range([0, innerW])
  const y = d3
    .scaleBand()
    .domain(sorted.map((d) => d.name))
    .range([0, sorted.length * rowH])
    .paddingInner(0.35)
    .paddingOuter(0.15)

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label="ROI por propiedad">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {x.ticks(5).map((t) => (
            <g key={t} transform={`translate(${x(t)},0)`}>
              <line y2={sorted.length * rowH} stroke={INK.grid} strokeWidth={1} />
              <text
                y={sorted.length * rowH + 16}
                textAnchor="middle"
                fill={INK.muted}
                fontSize={11}
              >
                {fmtPct(t)}
              </text>
            </g>
          ))}
          <line
            x1={x(0)}
            x2={x(0)}
            y2={sorted.length * rowH}
            stroke={INK.axis}
            strokeWidth={1.5}
          />
          {sorted.map((d) => {
            const barY = y(d.name)!
            const w = Math.abs(x(d.roi) - x(0))
            const barX = d.roi >= 0 ? x(0) : x(d.roi)
            const color = d.roi >= 0 ? DIVERGING.pos : DIVERGING.neg
            return (
              <g key={d.name}>
                <text
                  x={-10}
                  y={barY + y.bandwidth() / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={INK.secondary}
                  fontSize={12}
                >
                  {d.name.length > 20 ? d.name.slice(0, 19) + '…' : d.name}
                </text>
                {/* hit target más grande que la barra */}
                <rect
                  x={0}
                  y={barY - 4}
                  width={innerW}
                  height={y.bandwidth() + 8}
                  fill="transparent"
                  onMouseMove={(e) => {
                    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                    setHover({ d, x: e.clientX - r.left, y: e.clientY - r.top })
                  }}
                  onMouseLeave={() => setHover(null)}
                />
                <rect
                  x={barX}
                  y={barY}
                  width={Math.max(w, 1)}
                  height={y.bandwidth()}
                  rx={4}
                  fill={color}
                  pointerEvents="none"
                />
                <text
                  x={d.roi >= 0 ? x(d.roi) + 8 : x(0) + 8}
                  y={barY + y.bandwidth() / 2}
                  dominantBaseline="middle"
                  fill={INK.primary}
                  fontSize={12}
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {fmtPct(d.roi)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      {hover && (
        <Tooltip x={hover.x} y={hover.y} width={width}>
          <div className="font-semibold text-white">{hover.d.name}</div>
          <div className="mt-1 text-slate-300">Invertido: {fmtUsd(hover.d.invested)}</div>
          <div className="text-slate-300">Ganancia: {fmtUsd(hover.d.profit)}</div>
          <div className="text-slate-300">ROI: {fmtPct(hover.d.roi)}</div>
        </Tooltip>
      )}
    </div>
  )
}
