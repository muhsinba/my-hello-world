'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/app/i18n-config'

type SwitcherDict = {
  switcherLabel: string
  en: string
  tr: string
}

function Flag({ locale }: { locale: Locale }) {
  if (locale === 'en') {
    // England — St George's Cross
    return (
      <svg viewBox="0 0 30 20" width="22" height="15" aria-hidden="true">
        <rect width="30" height="20" fill="#ffffff" />
        <rect x="12" width="6" height="20" fill="#ce1126" />
        <rect y="7" width="30" height="6" fill="#ce1126" />
      </svg>
    )
  }
  // Turkey — red field, white crescent + star
  return (
    <svg viewBox="0 0 30 20" width="22" height="15" aria-hidden="true">
      <rect width="30" height="20" fill="#e30a17" />
      <circle cx="11" cy="10" r="4.5" fill="#ffffff" />
      <circle cx="12" cy="10" r="3.6" fill="#e30a17" />
      <polygon
        fill="#ffffff"
        points="18.5,7.5 19.1,9.2 20.9,9.2 19.4,10.3 20,12 18.5,10.9 17,12 17.6,10.3 16.1,9.2 17.9,9.2"
      />
    </svg>
  )
}

export default function LanguageSwitcher({
  currentLang,
  dict,
}: {
  currentLang: Locale
  dict: SwitcherDict
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const swap = (target: Locale) => {
    const rest = pathname.replace(new RegExp(`^/${currentLang}`), '')
    return `/${target}${rest || ''}`
  }

  const pick = (target: Locale) => {
    setOpen(false)
    if (target !== currentLang) router.push(swap(target))
  }

  return (
    <div ref={ref} className="lang-switcher">
      <button
        type="button"
        className="lang-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={dict.switcherLabel}
      >
        <Flag locale={currentLang} />
        <span>{dict[currentLang]}</span>
        <span className="lang-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={dict.switcherLabel}>
          {locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === currentLang}>
              <button type="button" onClick={() => pick(loc)}>
                <Flag locale={loc} />
                <span>{dict[loc]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
