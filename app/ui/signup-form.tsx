'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'

type SignupDict = {
  title: string
  name: string
  namePlaceholder: string
  email: string
  password: string
  emailPlaceholder: string
  passwordMustLabel: string
  submit: string
  submitting: string
  hasAccount: string
  logInLink: string
}

export default function SignupForm({
  lang,
  dict,
}: {
  lang: string
  dict: SignupDict
}) {
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <div className="auth-wrapper">
      <form action={action} className="auth-card">
        <input type="hidden" name="locale" value={lang} />
        <h1 className="auth-title">{dict.title}</h1>

        <div className="auth-field">
          <label htmlFor="name">{dict.name}</label>
          <input id="name" name="name" placeholder={dict.namePlaceholder} />
          {state?.errors?.name && <p className="auth-error">{state.errors.name[0]}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="email">{dict.email}</label>
          <input id="email" name="email" type="email" placeholder={dict.emailPlaceholder} />
          {state?.errors?.email && <p className="auth-error">{state.errors.email[0]}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="password">{dict.password}</label>
          <input id="password" name="password" type="password" />
          {state?.errors?.password && (
            <div className="auth-error">
              <p>{dict.passwordMustLabel}</p>
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
          {pending ? dict.submitting : dict.submit}
        </button>

        <p className="auth-switch">
          {dict.hasAccount} <Link href={`/${lang}/login`}>{dict.logInLink}</Link>
        </p>
      </form>
    </div>
  )
}
