'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import SyncButton from '@/components/SyncButton'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/propiedades', label: 'Propiedades' },
  { href: '/transacciones', label: 'Transacciones' },
  { href: '/socios', label: 'Socios' },
  { href: '/caja', label: 'Caja' },
  { href: '/informes', label: 'Informes' },
]

export default function Nav() {
  const pathname = usePathname()
  if (pathname === '/login') return null

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 text-lg font-bold tracking-tight text-white">
          Los Increíbles
        </Link>
        {LINKS.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <SyncButton />
          <form action={logout}>
            <button className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-white">
              Salir
            </button>
          </form>
        </div>
      </nav>
    </header>
  )
}
