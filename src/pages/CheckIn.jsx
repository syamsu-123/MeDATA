import { useEffect, useMemo, useState } from 'react'
import { Search, UserCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
import { checkIn, subscribeStudents } from '../services/firestoreService'

const LOCALE_MAP = { id: 'id-ID', en: 'en-US', ar: 'ar-SA', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' }

export default function CheckIn() {
  const { user, isViewer } = useAuth()
  const { activeLocation } = useLocationContext()
  const { showToast } = useToast()
  const { t, lang } = useLanguage()
  const [students, setStudents] = useState([])
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState(null)
  const [keluhan, setKeluhan] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => subscribeStudents(setStudents, setError), [])

  const results = useMemo(
    () =>
      students
        .filter((s) => `${s.name} ${s.nis} ${s.nisn}`.toLowerCase().includes(term.toLowerCase()))
        .slice(0, 8),
    [students, term],
  )

  const submit = async (e) => {
    e.preventDefault()
    if (isViewer) {
      setError(t('checkin.viewerError'))
      return
    }
    if (!selected) return setError(t('checkin.selectFirst'))
    setError('')
    setConfirming(true)
  }

  const confirmCheckIn = async () => {
    setBusy(true)
    setError('')
    try {
      await checkIn(selected, activeLocation, keluhan.trim(), user.uid)
      showToast(t('checkin.success'))
      setConfirming(false)
      setSelected(null)
      setTerm('')
      setKeluhan('')
    } catch (err) {
      setConfirming(false)
      setError(err.message || t('checkin.failed'))
    } finally {
      setBusy(false)
    }
  }

  const nowLabel = confirming
    ? new Date().toLocaleString(LOCALE_MAP[lang] || 'id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : ''

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('checkin.eyebrow')} {activeLocation.toUpperCase()}</span>
          <h2>{t('checkin.title')}</h2>
          <p>{t('checkin.desc')}</p>
        </div>
      </div>

      {isViewer && (
        <div className="alert warning" style={{ marginBottom: '16px' }}>
          <span dangerouslySetInnerHTML={{ __html: t('viewer.checkin') }} />
        </div>
      )}

      <form className="form-card checkin-form" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        <label>
          {t('checkin.searchStudent')}
          <div className="search-input">
            <Search size={17} />
            <input
              value={term}
              onChange={(e) => {
                setTerm(e.target.value)
                setSelected(null)
              }}
              placeholder={t('checkin.searchPlaceholder')}
              disabled={isViewer}
            />
          </div>
        </label>
        {term && !selected && !isViewer && (
          <div className="search-results">
            {results.map((student) => (
              <button
                type="button"
                key={student.id}
                onClick={() => {
                  setSelected(student)
                  setTerm(student.name)
                }}
              >
                <strong>{student.name}</strong>
                <span>
                  {student.nis || student.nisn || t('checkin.noNis')} · {student.class || t('checkin.noClass')}
                </span>
              </button>
            ))}
            {!results.length && <span className="muted">{t('checkin.notFound')}</span>}
          </div>
        )}
        {selected && (
          <div className="student-selected">
            <UserCheck size={24} />
            <div>
              <strong>{selected.name}</strong>
              <span>
                {selected.nis || selected.nisn} · {selected.class}
              </span>
            </div>
            {!isViewer && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setTerm('')
                }}
              >
                {t('checkin.change')}
              </button>
            )}
          </div>
        )}
        <label>
          {t('checkin.location')}
          <input value={activeLocation.toUpperCase()} disabled />
        </label>
        <label>
          {t('checkin.keluhan')}
          <textarea
            value={keluhan}
            onChange={(e) => setKeluhan(e.target.value)}
            placeholder={t('checkin.keluhanPlaceholder')}
            rows="3"
            disabled={isViewer}
          />
        </label>
        <button className="btn-primary" disabled={busy || isViewer}>
          {busy ? t('checkin.saving') : t('checkin.confirmBtn')}
        </button>
      </form>

      {confirming && !isViewer && (
        <div className="modal-backdrop">
          <div className="dialog">
            <div className="dialog-head">
              <h3>{t('checkin.confirmTitle')}</h3>
              <button
                type="button"
                className="dialog-close"
                onClick={() => setConfirming(false)}
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="checkin-confirm-patient student-selected">
              <UserCheck size={24} />
              <div>
                <strong>{selected.name}</strong>
                <span>
                  {selected.nis || selected.nisn || t('checkin.noNis')} ·{' '}
                  {selected.class || t('checkin.noClass')}
                </span>
              </div>
            </div>
            <dl className="checkin-confirm-fields">
              <div>
                <dt>{t('checkin.popupDateTime')}</dt>
                <dd>{nowLabel}</dd>
              </div>
              <div>
                <dt>{t('checkin.popupKeluhan')}</dt>
                <dd>{keluhan.trim() || t('common.dash')}</dd>
              </div>
            </dl>
            <p className="muted" style={{ margin: '0', lineHeight: '1.6' }}>
              {t('checkin.popupNote')}
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmCheckIn}
                disabled={busy}
              >
                {busy ? t('checkin.saving') : t('checkin.confirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
