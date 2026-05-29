import * as z from 'zod'
import type { Dictionary } from '@/app/[lang]/dictionaries'

export const buildSignupSchema = (errors: Dictionary['errors']) =>
  z.object({
    name: z
      .string()
      .min(2, { error: errors.nameMin })
      .trim(),
    email: z.email({ error: errors.emailInvalid }).trim(),
    password: z
      .string()
      .min(8, { error: errors.passwordMin })
      .regex(/[a-zA-Z]/, { error: errors.passwordLetter })
      .regex(/[0-9]/, { error: errors.passwordNumber })
      .regex(/[^a-zA-Z0-9]/, { error: errors.passwordSpecial })
      .trim(),
  })

export const buildLoginSchema = (errors: Dictionary['errors']) =>
  z.object({
    email: z.email({ error: errors.emailInvalid }).trim(),
    password: z.string().min(1, { error: errors.passwordRequired }),
  })

export type FormState =
  | {
      errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type SessionPayload = {
  userId: string
  loginId: number
  expiresAt: Date
}
