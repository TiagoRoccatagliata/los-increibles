'use client'

import { useState } from 'react'
import * as d3 from 'd3'
import { useSize } from './useSize'
import Tooltip from './Tooltip'
import { DIVERGING, INK } from './theme'
import { fmtUsd } from '@/lib/format'
import type { MonthlyCashflow } from '@/lib/metrics'

const fmtMonth = (m: string) => {
  const [y, mm] = m.split('-')
  return new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(y), Number(mm) - 1, 15)))
}

/** Barras divergentes: ingresos hacia arriba, egresos hacia abajo, por mes */
export default function CashflowChart({ data }: { data: MonthlyCashflow[] }) {
  const { ref, width } = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<{ d: MonthlyCashflow; x: number; y: number } | null>(null)

  const height = 320
  const margin = { top: 12, right: 12, bottom: 28, left: 70 }

  if (width === 0 || data.length === 0) return <div ref={ref} className="h-80 w-full" />

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const x = d3.scaleBand().domain(data.map((d) => d.month)).range([0, innerW]).paddingInner(0.25)
  const maxV = d3.max(data, (d) => Math.max(d.ingreso, d.egreso)) ?? 1
  const y = d3.scaleLinear().domain([-maxV, maxV]).nice().range([innerH, 0])

  const tickEvery = Math.ceil(data.length / Math.max(1, Math.floor(innerW / 70)))

  return (
    <div ref={ref} className="relative w-full">
      <div className="mb-2 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DIVERGING.pos }} />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DIVERGING.neg }} />
          Egresos
        </span>
      </div>
      <svg width={width} height={height} role="img" aria-label="Flujo de caja mensual">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {y.ticks(6).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke={t === 0 ? INK.axis : INK.grid} strokeWidth={t === 0 ? 1.5 : 1} />
              <text x={-8} textAnchor="end" dominantBaseline="middle" fill={INK.muted} fontSize={11}>
                {fmtUsd(Math.abs(t))}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const bx = x(d.month)!
            const bw = x.bandwidth()
            return (
              <g key={d.month}>
                <rect
                  x={bx - 2}
                  y={0}
                  width={bw + 4}
                  height={innerH}
                  fill={hover?.d.month === d.month ? 'rgba(255,255,255,0.04)' : 'transparent'}
                  onMouseMove={(e) => {
                    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                    setHover({ d, x: e.clientX - r.left, y: e.clientY - r.top })
                  }}
                  onMouseLeave={() => setHover(null)}
                />
                {d.ingreso > 0 && (
                  <rect
                    x={bx}
                    y={y(d.ingreso)}
                    width={bw}
                    height={y(0) - y(d.ingreso)}
                    rx={4}
                    fill={DIVERGING.pos}
                    pointerEvents="none"
                  />
                )}
                {d.egreso > 0 && (
                  <rect
                    x={bx}
                    y={y(0) + 2}
                    width={bw}
                    height={Math.max(1, y(-d.egreso) - y(0) - 2)}
                    rx={4}
                    fill={DIVERGING.neg}
                    pointerEvents="none"
                  />
                )}
                {i % tickEvery === 0 && (
                  <text
                    x={bx + bw / 2}
                    y={innerH + 18}
                    textAnchor="middle"
                    fill={INK.muted}
                    fontSize={11}
                  >
                    {fmtMonth(d.month)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      {hover && (
        <Tooltip x={hover.x} y={hover.y} width={width}>
          <div className="font-semibold text-white">{fmtMonth(hover.d.month)}</div>
          <div className="mt-1 text-slate-300">Ingresos: {fmtUsd(hover.d.ingreso)}</div>
          <div className="text-slate-300">Egresos: {fmtUsd(hover.d.egreso)}</div>
          <div className="text-slate-300">Neto: {fmtUsd(hover.d.ingreso - hover.d.egreso)}</div>
        </Tooltip>
      )}
    </div>
  )
}
