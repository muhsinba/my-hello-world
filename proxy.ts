import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/app/lib/session'
import { defaultLocale, hasLocale, locales, type Locale } from '@/app/i18n-config'

// Routes only meaningful when logged OUT. Logged-in users get bounced home.
const authRoutes = ['/login', '/signup']

// Routes that require a logged-IN user. Add paths here to gate them.
const protectedRoutes: string[] = []

// Pick the best-matching locale from Accept-Language. Falls back to defaultLocale.
function detectLocale(req: NextRequest): Locale {
  const header = req.headers.get('accept-language') ?? ''
  for (const entry of header.split(',')) {
    const tag = entry.split(';')[0].trim().toLowerCase()
    const primary = tag.split('-')[0]
    if (hasLocale(primary)) return primary
  }
  return defaultLocale
}

// Split "/en/login" into { locale: "en", rest: "/login" }
function splitLocale(path: string): { locale: Locale | null; rest: string } {
  for (const loc of locales) {
    if (path === `/${loc}`) return { locale: loc, rest: '/' }
    if (path.startsWith(`/${loc}/`)) return { locale: loc, rest: path.slice(`/${loc}`.length) }
  }
  return { locale: null, rest: path }
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const { locale: pathLocale, rest } = splitLocale(path)

  // 1. If the URL has no locale prefix, redirect to /{detectedLocale}{path}.
  if (!pathLocale) {
    const target = detectLocale(req)
    const url = req.nextUrl.clone()
    url.pathname = `/${target}${path === '/' ? '' : path}`
    return NextResponse.redirect(url)
  }

  // 2. Locale is present. Do auth gating on the path *without* the locale.
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)
  const isLoggedIn = Boolean(session?.userId)

  if (protectedRoutes.includes(rest) && !isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = `/${pathLocale}/login`
    return NextResponse.redirect(url)
  }

  if (authRoutes.includes(rest) && isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = `/${pathLocale}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Skip Next internals, static assets, and the OG image route.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|icon.svg|opengraph-image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp)$).*)'],
}
