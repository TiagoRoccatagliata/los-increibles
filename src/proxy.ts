import { NextRequest, NextResponse } from 'next/server'
import { isValidSession, SESSION_COOKIE } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/login') return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (await isValidSession(token)) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
