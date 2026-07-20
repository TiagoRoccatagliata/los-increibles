export const SESSION_COOKIE = 'li_session'

// Token = HMAC-SHA256(SESSION_SECRET, payload fijo). Web Crypto para que
// funcione igual en middleware (edge) y en server actions (node).
async function hmac(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function sessionToken(): Promise<string> {
  return hmac(process.env.SESSION_SECRET!, 'los-increibles:v1')
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  return token === (await sessionToken())
}
