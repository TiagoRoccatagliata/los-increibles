'use client'

import { useState } from 'react'
import { fmtPct, fmtUsd } from '@/lib/format'

type Member = { name: string; sharePct: number }

type Props = {
  investedUsd: number // egresos históricos totales
  incomeUsd: number // ingresos históricos (recuperos, alquileres)
  holdingDays: number
  defaultPrice: number // publicación o última valuación
  monthlyCost: number // costo de tenencia mensual estimado
  members: Member[]
}

function netProfit(price: number, feePct: number, invested: number, income: number) {
  return price * (1 - feePct / 100) + income - invested
}

function annualized(profit: number, invested: number, days: number) {
  if (invested <= 0) return 0
  const r = profit / invested
  const years = Math.max(days, 1) / 365
  if (1 + r <= 0) return -1
  return Math.pow(1 + r, 1 / years) - 1
}

export default function SaleSimulator({
  investedUsd,
  incomeUsd,
  holdingDays,
  defaultPrice,
  monthlyCost,
  members,
}: Props) {
  const [price, setPrice] = useState(defaultPrice)
  const [feePct, setFeePct] = useState(4)

  const profit = netProfit(price, feePct, investedUsd, incomeUsd)
  const roiTotal = investedUsd > 0 ? profit / investedUsd : 0
  const roiAnnual = annualized(profit, investedUsd, holdingDays)
  const sensitivity = [-0.1, -0.05, 0, 0.05, 0.1].map((d) => {
    const p = price * (1 + d)
    const g = netProfit(p, feePct, investedUsd, incomeUsd)
    return { delta: d, price: p, profit: g, annual: annualized(g, investedUsd, holdingDays) }
  })

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-semibold">Simulador de venta</h2>
      <p className="mb-3 text-sm text-slate-500">
        ¿Nos conviene aceptar una oferta? Probá precios y mirá qué queda neto y cuánto le toca a
        cada socio.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <label className="block">
            <span className="text-xs text-slate-500">Precio de venta (USD)</span>
            <input
              type="number"
              min="0"
              step="1000"
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-sky-600 focus:outline-none"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-xs text-slate-500">Comisión + gastos de venta (%)</span>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={feePct}
              onChange={(e) => setFeePct(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-sky-600 focus:outline-none"
            />
          </label>

          <dl className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Neto de comisión</dt>
              <dd className="text-white">{fmtUsd(price * (1 - feePct / 100))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Invertido hasta hoy</dt>
              <dd className="text-white">{fmtUsd(investedUsd)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt className="text-slate-400">Ganancia neta</dt>
              <dd className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {fmtUsd(profit)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">ROI · anualizado</dt>
              <dd className={roiTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {fmtPct(roiTotal)} · {fmtPct(roiAnnual)}
              </dd>
            </div>
          </dl>

          {monthlyCost > 0 && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              Cada mes sin vender cuesta ~{fmtUsd(monthlyCost)} en expensas, impuestos y
              servicios: esperar 6 meses equivale a bajar el precio {fmtUsd(monthlyCost * 6)}.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Ganancia por socio</h3>
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li key={m.name} className="flex items-center justify-between">
                <span className="text-slate-400">
                  {m.name} <span className="text-xs text-slate-600">({m.sharePct.toFixed(1)}%)</span>
                </span>
                <span
                  className={`font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {fmtUsd((profit * m.sharePct) / 100)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Precio</th>
                <th className="px-4 py-2.5 text-right font-medium">Ganancia</th>
                <th className="px-4 py-2.5 text-right font-medium">ROI anual</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((s) => (
                <tr
                  key={s.delta}
                  className={`border-t border-slate-800 ${s.delta === 0 ? 'bg-slate-900/70' : ''}`}
                >
                  <td className="px-4 py-2.5 text-slate-300">
                    {fmtUsd(s.price)}
                    <span className="ml-1 text-xs text-slate-600">
                      {s.delta === 0 ? '(actual)' : `${s.delta > 0 ? '+' : ''}${s.delta * 100}%`}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-medium ${
                      s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {fmtUsd(s.profit)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-300">{fmtPct(s.annual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
