import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from '@/app/lib/session'
import { db, type UserRow } from '@/app/lib/db'

/**
 * Reads and verifies the session cookie. Redirects to /login when absent.
 * Memoized per render pass so repeated calls don't re-parse the cookie.
 */
export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId }
})

/** Returns the current user (safe columns only), or null if not logged in. */
export const getUser = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)
  if (!session?.userId) return null

  try {
    const user = db
      .prepare('SELECT id, name, email FROM users WHERE id = ?')
      .get(Number(session.userId)) as Pick<UserRow, 'id' | 'name' | 'email'> | undefined

    return user ?? null
  } catch {
    console.log('Failed to fetch user')
    return null
  }
})
