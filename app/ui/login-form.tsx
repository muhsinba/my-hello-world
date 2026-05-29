'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

type LoginDict = {
  title: string
  email: string
  password: string
  emailPlaceholder: string
  submit: string
  submitting: string
  noAccount: string
  signUpLink: string
}

type ErrorDict = { invalidCredentials: string }

export default function LoginForm({
  lang,
  dict,
  errors,
}: {
  lang: string
  dict: LoginDict
  errors: ErrorDict
}) {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="auth-wrapper">
      <form action={action} className="auth-card">
        <input type="hidden" name="locale" value={lang} />
        <h1 className="auth-title">{dict.title}</h1>

        <div className="auth-field">
          <label htmlFor="email">{dict.email}</label>
          <input id="email" name="email" type="email" placeholder={dict.emailPlaceholder} />
          {state?.errors?.email && <p className="auth-error">{state.errors.email[0]}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="password">{dict.password}</label>
          <input id="password" name="password" type="password" />
          {state?.errors?.password && <p className="auth-error">{state.errors.password[0]}</p>}
        </div>

        {state?.message && <p className="auth-error">{state.message}</p>}

        <button disabled={pending} type="submit" className="auth-button">
          {pending ? dict.submitting : dict.submit}
        </button>

        <p className="auth-switch">
          {dict.noAccount} <Link href={`/${lang}/signup`}>{dict.signUpLink}</Link>
        </p>
      </form>
    </div>
  )
}
