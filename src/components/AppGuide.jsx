import { useEffect, useState } from 'react'
import { Activity, ArrowRight, BookOpen, ClipboardList, LayoutDashboard, Users, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const steps = [
  { icon: LayoutDashboard, key: 'step1' },
  { icon: ClipboardList, key: 'step2' },
  { icon: Activity, key: 'step3' },
  { icon: Users, key: 'step4' },
  { icon: BookOpen, key: 'step5' },
]

export default function AppGuide({ open, onClose }) {
  const { t } = useLanguage()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  if (!open) return null

  const step = steps[index]
  const Icon = step.icon
  const last = index === steps.length - 1
  const advance = () => (last ? onClose() : setIndex(index + 1))

  return (
    <div className="guide-overlay" role="dialog" aria-modal="true" aria-label={t('guide.title')}>
      <div className="guide-card">
        <button className="guide-close" type="button" onClick={onClose} aria-label={t('common.close')}>
          <X size={18} />
        </button>

        <div className="guide-head">
          <img className="guide-logo" src="/medata-icon.svg" alt={t('app.name')} />
          <em>{t('app.tag').toUpperCase()}</em>
          <h3>{t('guide.title')}</h3>
          <p>{t('guide.subtitle')}</p>
        </div>

        <div className="guide-body" key={step.key}>
          <div className="guide-icon">
            <Icon size={30} />
          </div>
          <h4>{t(`guide.${step.key}.title`)}</h4>
          <p>{t(`guide.${step.key}.desc`)}</p>
        </div>

        <div className="guide-dots">
          {steps.map((item, i) => (
            <button
              key={item.key}
              type="button"
              className={i === index ? 'dot active' : 'dot'}
              onClick={() => setIndex(i)}
              aria-label={`${t('guide.step')} ${i + 1}`}
            />
          ))}
        </div>

        <div className="guide-actions">
          <button className="guide-skip" type="button" onClick={onClose}>
            {t('guide.skip')}
          </button>
          <button className="guide-next" type="button" onClick={advance}>
            {last ? t('guide.done') : t('guide.next')}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}