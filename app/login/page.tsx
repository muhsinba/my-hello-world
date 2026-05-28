'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="auth-wrapper">
      <form action={action} className="auth-card">
        <h1 className="auth-title">Log in</h1>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" />
          {state?.errors?.email && <p className="auth-error">{state.errors.email[0]}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" />
          {state?.errors?.password && <p className="auth-error">{state.errors.password[0]}</p>}
        </div>

        {state?.message && <p className="auth-error">{state.message}</p>}

        <button disabled={pending} type="submit" className="auth-button">
          {pending ? 'Logging in…' : 'Log In'}
        </button>

        <p className="auth-switch">
          No account yet? <Link href="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  )
}
