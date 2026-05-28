import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { SessionPayload } from '@/app/lib/definitions'

const secretKey = process.env.SESSION_SECRET
if (!secretKey) {
  throw new Error('SESSION_SECRET environment variable is required')
}
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload & { iat: number; exp: number }
  } catch {
    return undefined
  }
}

export async function createSession(userId: string, loginId: number) {
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000)
  const session = await encrypt({ userId, loginId, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    // Opt-in via env var so HTTP-only demos work; flip to true once HTTPS is on.
    secure: process.env.SECURE_COOKIES === 'true',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  return decrypt(cookieStore.get('session')?.value)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
