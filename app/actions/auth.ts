'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import {
  buildSignupSchema,
  buildLoginSchema,
  type FormState,
} from '@/app/lib/definitions'
import { db, type UserRow } from '@/app/lib/db'
import { createSession, deleteSession, getSession } from '@/app/lib/session'
import {
  defaultLocale,
  getDictionary,
  hasLocale,
  type Locale,
} from '@/app/[lang]/dictionaries'

function readLocale(formData: FormData): Locale {
  const value = formData.get('locale')
  return typeof value === 'string' && hasLocale(value) ? value : defaultLocale
}

export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  const locale = readLocale(formData)
  const dict = await getDictionary(locale)

  const validatedFields = buildSignupSchema(dict.errors).safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { name, email, password } = validatedFields.data

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return { errors: { email: [dict.errors.emailExists] } }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const result = db
    .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
    .run(name, email, hashedPassword)

  if (!result.lastInsertRowid) {
    return { message: dict.errors.signupFailed }
  }

  const userId = Number(result.lastInsertRowid)
  const loginResult = db
    .prepare('INSERT INTO login_history (user_id) VALUES (?)')
    .run(userId)
  await createSession(String(userId), Number(loginResult.lastInsertRowid))
  redirect(`/${locale}`)
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const locale = readLocale(formData)
  const dict = await getDictionary(locale)

  const validatedFields = buildLoginSchema(dict.errors).safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { email, password } = validatedFields.data

  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email) as UserRow | undefined

  // Use the same generic message whether the email or password is wrong,
  // so we don't reveal which emails are registered.
  const invalid: FormState = { message: dict.errors.invalidCredentials }
  if (!user) return invalid

  const passwordsMatch = await bcrypt.compare(password, user.password)
  if (!passwordsMatch) return invalid

  const loginResult = db
    .prepare('INSERT INTO login_history (user_id) VALUES (?)')
    .run(user.id)

  await createSession(String(user.id), Number(loginResult.lastInsertRowid))
  redirect(`/${locale}`)
}

export async function logout() {
  const session = await getSession()
  if (session?.loginId) {
    db.prepare(`UPDATE login_history SET logged_out_at = datetime('now') WHERE id = ?`)
      .run(session.loginId)
  }
  await deleteSession()
  redirect('/')
}
