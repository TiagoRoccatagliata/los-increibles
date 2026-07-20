'use client'

import { useActionState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined)

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">Los Increíbles</h1>
        <p className="mt-1 text-sm text-slate-400">Gestor de inversiones inmobiliarias</p>
        <label className="mt-6 block text-sm font-medium text-slate-300" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
        />
        {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-sky-600 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
