import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/app/lib/session'

// Routes only meaningful when logged OUT. Logged-in users get bounced home.
const authRoutes = ['/login', '/signup']

// Routes that require a logged-IN user. Add paths here to gate them.
const protectedRoutes: string[] = []

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Optimistic check: only read the cookie here, never the database.
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)
  const isLoggedIn = Boolean(session?.userId)

  if (protectedRoutes.includes(path) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (authRoutes.includes(path) && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
}

// Skip Next internals and static assets.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
