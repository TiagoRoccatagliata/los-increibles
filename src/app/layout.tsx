import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Nav from '@/components/ui/Nav'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Los Increíbles — Inversiones inmobiliarias',
  description: 'Gestor de inversiones inmobiliarias de compra-venta',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
        <Nav />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</div>
      </body>
    </html>
  )
}
