'use client'

import { ReactNode } from 'react'

/** Tooltip posicionado dentro de un contenedor relative */
export default function Tooltip({
  x,
  y,
  width,
  children,
}: {
  x: number
  y: number
  width: number
  children: ReactNode
}) {
  const flip = x > width * 0.6
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-slate-700 bg-slate-800/95 px-3 py-2 text-xs shadow-lg"
      style={{
        left: flip ? undefined : x + 12,
        right: flip ? width - x + 12 : undefined,
        top: Math.max(0, y - 10),
      }}
    >
      {children}
    </div>
  )
}
