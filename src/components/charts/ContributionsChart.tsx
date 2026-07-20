'use client'

import { useState } from 'react'
import * as d3 from 'd3'
import { useSize } from './useSize'
import Tooltip from './Tooltip'
import { INK, SERIES } from './theme'
import { fmtUsd } from '@/lib/format'

export type ContributionDatum = { name: string; amount: number; pct: number }

/** Barras horizontales de aportes por socio (una serie: azul) */
export default function ContributionsChart({ data }: { data: ContributionDatum[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<{ d: ContributionDatum; x: number; y: number } | null>(null)

  const sorted = [...data].sort((a, b) => b.amount - a.amount)
  const rowH = 36
  const margin = { top: 8, right: 90, bottom: 24, left: 80 }
  const height = margin.top + margin.bottom + sorted.length * rowH

  if (width === 0 || sorted.length === 0) return <div ref={ref} className="h-40 w-full" />

  const innerW = width - margin.left - margin.right
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(sorted, (d) => d.amount) ?? 1])
    .nice()
    .range([0, innerW])
  const y = d3
    .scaleBand()
    .domain(sorted.map((d) => d.name))
    .range([0, sorted.length * rowH])
    .paddingInner(0.35)
    .paddingOuter(0.15)

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label="Aportes por socio">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {x.ticks(5).map((t) => (
            <g key={t} transform={`translate(${x(t)},0)`}>
              <line y2={sorted.length * rowH} stroke={INK.grid} strokeWidth={1} />
              <text y={sorted.length * rowH + 16} textAnchor="middle" fill={INK.muted} fontSize={11}>
                {fmtUsd(t)}
              </text>
            </g>
          ))}
          {sorted.map((d) => {
            const barY = y(d.name)!
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
                  {d.name}
                </text>
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
                  x={0}
                  y={barY}
                  width={Math.max(x(d.amount), 1)}
                  height={y.bandwidth()}
                  rx={4}
                  fill={SERIES[0]}
                  pointerEvents="none"
                />
                <text
                  x={x(d.amount) + 8}
                  y={barY + y.bandwidth() / 2}
                  dominantBaseline="middle"
                  fill={INK.primary}
                  fontSize={12}
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {fmtUsd(d.amount)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      {hover && (
        <Tooltip x={hover.x} y={hover.y} width={width}>
          <div className="font-semibold text-white">{hover.d.name}</div>
          <div className="mt-1 text-slate-300">Aportes: {fmtUsd(hover.d.amount)}</div>
          <div className="text-slate-300">Participación: {hover.d.pct.toFixed(2)}%</div>
        </Tooltip>
      )}
    </div>
  )
}
