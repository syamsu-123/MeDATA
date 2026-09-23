import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations, RTL_LANGUAGES } from '../i18n'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'medata-language'
const VALID_LANGS = Object.keys(translations)

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && VALID_LANGS.includes(stored)) return stored
  } catch {}
  return 'id'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)

  const setLang = useCallback(
    (value) => {
      if (!VALID_LANGS.includes(value)) return
      if (value === lang) return
      const prev = lang
      const enteringRtl = RTL_LANGUAGES.includes(value)
      const leavingRtl = RTL_LANGUAGES.includes(prev)

      const enforce = () => {
        document.documentElement.dir = enteringRtl ? 'rtl' : 'ltr'
        document.documentElement.classList.add('lang-switching')
        setLangState(value)
        setTimeout(() => {
          document.documentElement.classList.remove('lang-switching')
        }, 560)
      }

      // Direction switch (LTR <-> RTL / Arabic): fade whole app out,
      // flip direction, then reveal content with an elegant slide-in.
      if (enteringRtl !== leavingRtl) {
        document.documentElement.classList.add('lang-direction-fade')
        setTimeout(() => {
          enforce()
          setTimeout(() => {
            document.documentElement.classList.remove('lang-direction-fade')
          }, 380)
        }, 170)
      } else {
        // Same direction: reveal content with a gentle slide-in only.
        document.documentElement.dir = enteringRtl ? 'rtl' : 'ltr'
        document.documentElement.classList.add('lang-switching')
        setLangState(value)
        setTimeout(() => {
          document.documentElement.classList.remove('lang-switching')
        }, 560)
      }
    },
    [lang],
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {}
    const isRtl = RTL_LANGUAGES.includes(lang)
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (key) => {
      if (translations[lang]?.[key]) return translations[lang][key]
      if (translations.id?.[key]) return translations.id[key]
      return key
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, language: lang, setLang, setLanguage: setLang, t }),
    [lang, setLang, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
