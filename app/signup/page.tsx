'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <div className="auth-wrapper">
      <form action={action} className="auth-card">
        <h1 className="auth-title">Create account</h1>

        <div className="auth-field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" placeholder="Jane Doe" />
          {state?.errors?.name && <p className="auth-error">{state.errors.name[0]}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" />
          {state?.errors?.email && <p className="auth-error">{state.errors.email[0]}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" />
          {state?.errors?.password && (
            <div className="auth-error">
              <p>Password must:</p>
              <ul>
                {state.errors.password.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {state?.message && <p className="auth-error">{state.message}</p>}

        <button disabled={pending} type="submit" className="auth-button">
          {pending ? 'Creating…' : 'Sign Up'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
