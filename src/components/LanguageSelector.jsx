import { useEffect, useRef, useState } from 'react'
import { Languages, ChevronDown, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { languages } from '../i18n'

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = languages[lang] || languages.id

  return (
    <div className="lang-selector" ref={ref}>
      <button
        className="lang-selector-trigger"
        onClick={() => setOpen(!open)}
        aria-label="Select language"
        title={current.label}
      >
        <Languages size={16} />
        <span className="lang-selector-flag">{current.flag}</span>
        <span className="lang-selector-label">{current.label}</span>
        <ChevronDown size={14} className={open ? 'rotated' : ''} />
      </button>
      {open && (
        <div className="lang-selector-dropdown">
          {Object.entries(languages).map(([code, info]) => (
            <button
              key={code}
              className={`lang-selector-option ${code === lang ? 'active' : ''}`}
              onClick={() => {
                setLang(code)
                setOpen(false)
              }}
            >
              <span className="lang-selector-flag">{info.flag}</span>
              <span>{info.label}</span>
              {code === lang && <Check size={14} className="lang-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
