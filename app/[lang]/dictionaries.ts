import 'server-only'
import type { Locale } from '@/app/i18n-config'

export { locales, defaultLocale, hasLocale, type Locale } from '@/app/i18n-config'

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  tr: () => import('./dictionaries/tr.json').then((m) => m.default),
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
