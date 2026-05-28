'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import {
  SignupFormSchema,
  LoginFormSchema,
  type FormState,
} from '@/app/lib/definitions'
import { db, type UserRow } from '@/app/lib/db'
import { createSession, deleteSession, getSession } from '@/app/lib/session'

export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate fields
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { name, email, password } = validatedFields.data

  // 2. Reject duplicate emails
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return { errors: { email: ['An account with this email already exists.'] } }
  }

  // 3. Hash the password and store the user
  const hashedPassword = await bcrypt.hash(password, 10)
  const result = db
    .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
    .run(name, email, hashedPassword)

  if (!result.lastInsertRowid) {
    return { message: 'An error occurred while creating your account.' }
  }

  // 4. Record the first login, create the session, then redirect
  const userId = Number(result.lastInsertRowid)
  const loginResult = db
    .prepare('INSERT INTO login_history (user_id) VALUES (?)')
    .run(userId)
  await createSession(String(userId), Number(loginResult.lastInsertRowid))
  redirect('/')
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
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
  const invalid: FormState = { message: 'Invalid email or password.' }
  if (!user) return invalid

  const passwordsMatch = await bcrypt.compare(password, user.password)
  if (!passwordsMatch) return invalid

  //create a login history record for the user
  const loginResult = db
    .prepare('INSERT INTO login_history (user_id) VALUES (?)')
    .run(user.id)

  await createSession(String(user.id), Number(loginResult.lastInsertRowid))
  redirect('/')
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
