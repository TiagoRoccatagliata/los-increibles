'use client'

import { useState } from 'react'
import * as d3 from 'd3'
import { useSize } from './useSize'
import Tooltip from './Tooltip'
import { DIVERGING, INK, SERIES } from './theme'
import { fmtPct, fmtUsd } from '@/lib/format'

export type CompareDatum = {
  name: string
  invested: number
  profit: number
  roiAnnual: number
  days: number
  sold: boolean
}

/** Scatter: inversión (x) vs ganancia (y). Un punto por propiedad, con etiqueta directa. */
export default function CompareScatter({ data }: { data: CompareDatum[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<{ d: CompareDatum; x: number; y: number } | null>(null)

  const height = 380
  const margin = { top: 16, right: 24, bottom: 40, left: 70 }

  if (width === 0 || data.length === 0) return <div ref={ref} className="h-96 w-full" />

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const x = d3
    .scaleLinear()
    .domain([0, (d3.max(data, (d) => d.invested) ?? 1) * 1.1])
    .nice()
    .range([0, innerW])
  const yExt = d3.max(data, (d) => Math.abs(d.profit)) ?? 1
  const yMin = Math.min(0, d3.min(data, (d) => d.profit) ?? 0)
  const y = d3
    .scaleLinear()
    .domain([yMin < 0 ? -yExt * 1.15 : 0, yExt * 1.15])
    .nice()
    .range([innerH, 0])

  return (
    <div ref={ref} className="relative w-full">
      <div className="mb-2 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[0] }} />
          Vendida (ganancia realizada)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full border-2"
            style={{ borderColor: SERIES[0], background: 'transparent' }}
          />
          En cartera (proyectada)
        </span>
      </div>
      <svg width={width} height={height} role="img" aria-label="Comparación de propiedades">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {x.ticks(6).map((t) => (
            <g key={`x${t}`} transform={`translate(${x(t)},0)`}>
              <line y2={innerH} stroke={INK.grid} strokeWidth={1} />
              <text y={innerH + 18} textAnchor="middle" fill={INK.muted} fontSize={11}>
                {fmtUsd(t)}
              </text>
            </g>
          ))}
          {y.ticks(5).map((t) => (
            <g key={`y${t}`} transform={`translate(0,${y(t)})`}>
              <line
                x2={innerW}
                stroke={t === 0 ? INK.axis : INK.grid}
                strokeWidth={t === 0 ? 1.5 : 1}
              />
              <text x={-8} textAnchor="end" dominantBaseline="middle" fill={INK.muted} fontSize={11}>
                {fmtUsd(t)}
              </text>
            </g>
          ))}
          <text
            x={innerW / 2}
            y={innerH + 34}
            textAnchor="middle"
            fill={INK.secondary}
            fontSize={11}
          >
            Inversión total (USD)
          </text>
          {data.map((d) => (
            <g key={d.name}>
              <circle
                cx={x(d.invested)}
                cy={y(d.profit)}
                r={14}
                fill="transparent"
                onMouseMove={(e) => {
                  const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                  setHover({ d, x: e.clientX - r.left, y: e.clientY - r.top })
                }}
                onMouseLeave={() => setHover(null)}
              />
              <circle
                cx={x(d.invested)}
                cy={y(d.profit)}
                r={6}
                fill={d.sold ? (d.profit >= 0 ? SERIES[0] : DIVERGING.neg) : 'transparent'}
                stroke={d.sold ? INK.surface : d.profit >= 0 ? SERIES[0] : DIVERGING.neg}
                strokeWidth={2}
                pointerEvents="none"
              />
              <text
                x={x(d.invested)}
                y={y(d.profit) - 12}
                textAnchor="middle"
                fill={INK.secondary}
                fontSize={11}
                pointerEvents="none"
              >
                {d.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
      {hover && (
        <Tooltip x={hover.x} y={hover.y} width={width}>
          <div className="font-semibold text-white">{hover.d.name}</div>
          <div className="mt-1 text-slate-300">Inversión: {fmtUsd(hover.d.invested)}</div>
          <div className="text-slate-300">
            Ganancia {hover.d.sold ? 'realizada' : 'proyectada'}: {fmtUsd(hover.d.profit)}
          </div>
          <div className="text-slate-300">ROI anualizado: {fmtPct(hover.d.roiAnnual)}</div>
          <div className="text-slate-300">Tenencia: {hover.d.days} días</div>
        </Tooltip>
      )}
    </div>
  )
}
