import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
import { checkOut, subscribeVisits, updateTreatmentStatus } from '../services/firestoreService'
import VisitTable from '../components/common/VisitTable'
import { useRealtimeClock } from '../hooks/useRealtimeClock'

const LOCALE_MAP = { id: 'id-ID', en: 'en-US', ar: 'ar-SA', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' }

export default function ActiveStudents() {
  const { activeLocation } = useLocationContext()
  const { user, isViewer } = useAuth()
  const { showToast } = useToast()
  const { t, lang } = useLanguage()
  const { now, timeString, formatDuration } = useRealtimeClock()
  const [visits, setVisits] = useState([])
  const [error, setError] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [treatmentTarget, setTreatmentTarget] = useState(null)
  const [treatmentStatus, setTreatmentStatus] = useState('pending')
  const [treatmentNotes, setTreatmentNotes] = useState('')
  const [waTarget, setWaTarget] = useState(null)
  const [waScope, setWaScope] = useState('all')
  const [teacherName, setTeacherName] = useState('')
  const [teacherPhone, setTeacherPhone] = useState('')
  const [term, setTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const locale = LOCALE_MAP[lang] || 'id-ID'
  const loadedRef = useRef(false)
  const [locationKey, setLocationKey] = useState(activeLocation)

  if (activeLocation !== locationKey) {
    loadedRef.current = false
    setLocationKey(activeLocation)
  }

  useEffect(() => {
    loadedRef.current = false
    const unsub = subscribeVisits(
      activeLocation,
      (data) => {
        setVisits(data)
        loadedRef.current = true
      },
      (err) => {
        setError(err)
        loadedRef.current = true
      },
    )
    return unsub
  }, [activeLocation])

  const isLoading = !loadedRef.current

  const waVisits = waTarget?.visits || []
  const waSingle = waVisits.length <= 1

  const done = async () => {
    if (isViewer) {
      showToast(t('active.viewerCheckoutError'), 'error')
      setTarget(null)
      return
    }
    setBusy(true)
    try {
      await checkOut(target, user.uid)
      showToast(t('active.checkoutSuccess'))
      setTarget(null)
    } catch {
      showToast(t('active.checkoutFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const retryLoad = () => {
    setError('')
    loadedRef.current = false
  }

  const openTreatment = (visit) => {
    setTreatmentTarget(visit)
    setTreatmentStatus(visit.treatmentStatus || 'pending')
    setTreatmentNotes(visit.treatmentNotes || '')
  }

  const saveTreatment = async () => {
    if (!treatmentTarget) return
    setBusy(true)
    try {
      await updateTreatmentStatus(treatmentTarget.id, treatmentStatus, treatmentNotes, user.uid)
      showToast(t('active.treatmentSuccess'))
      setTreatmentTarget(null)
    } catch {
      showToast(t('active.treatmentFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const normalizeWaNumber = (raw) => {
    let digits = (raw || '').replace(/[^0-9]/g, '')
    if (digits.startsWith('0')) digits = '62' + digits.slice(1)
    else if (digits.startsWith('8')) digits = '62' + digits
    return digits
  }

  const filteredVisits = useMemo(() => {
    const q = term.toLowerCase()
    return visits.filter((v) => {
      if (v.status !== 'ACTIVE') return false
      const haystack = `${v.studentName} ${v.nis} ${v.keluhan}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      const cls = (v.studentClass || '').trim() || t('common.dash')
      if (classFilter && cls !== classFilter) return false
      if (statusFilter && (v.treatmentStatus || 'pending') !== statusFilter) return false
      return true
    })
  }, [visits, term, classFilter, statusFilter, t])

  const classOptions = useMemo(() => {
    const set = new Set(
      visits.filter((v) => v.status === 'ACTIVE').map((v) => (v.studentClass || '').trim() || t('common.dash')),
    )
    return [...set].sort((a, b) =>
      a === t('common.dash') ? 1 : b === t('common.dash') ? -1 : String(a).localeCompare(String(b), undefined, { numeric: true }),
    )
  }, [visits, t])

  const waGroups = useMemo(() => {
    const scoped = filteredVisits.filter((v) => {
      const status = v.treatmentStatus || 'pending'
      if (waScope === 'unhandled') return status !== 'treated'
      if (waScope === 'handled') return status === 'treated'
      return true
    })
    const groups = {}
    scoped.forEach((v) => {
      const key = v.studentClass || '-'
      if (!groups[key]) groups[key] = []
      groups[key].push(v)
    })
    return Object.entries(groups)
      .map(([class_, groupVisits]) => ({ class: class_, visits: groupVisits }))
      .sort((a, b) => (a.class === '-' ? 1 : b.class === '-' ? -1 : a.class.localeCompare(b.class, undefined, { numeric: true })))
  }, [filteredVisits, waScope])

  const formatWaTime = (checkIn) =>
    `${new Date(checkIn).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} ${t('common.wib')}`

  const buildWaMessage = (name) => {
    const visits_ = waTarget.visits || []
    if (visits_.length <= 1) {
      const v = visits_[0] || {}
      return t('active.waMessage')
        .replaceAll('{teacher}', name.trim() || '...')
        .replaceAll('{student}', v.studentName)
        .replaceAll('{class}', v.studentClass || '-')
        .replaceAll('{location}', v.locationId?.toUpperCase() || '-')
        .replaceAll('{keluhan}', v.keluhan || '-')
        .replaceAll('{time}', v.checkIn ? formatWaTime(v.checkIn) : '-')
    }
    const items = visits_.map((v, i) => {
      const nis = v.nis ? ` (${v.nis})` : ''
      const keluhan = v.keluhan || '-'
      const time = v.checkIn ? formatWaTime(v.checkIn) : '-'
      return `${i + 1}. ${v.studentName}${nis} — ${t('active.waItemKeluhan')}: ${keluhan} — ${t('active.waItemTime')} ${time}`
    }).join('\n')
    return t('active.waMessageList')
      .replaceAll('{teacher}', name.trim() || '...')
      .replaceAll('{class}', visits_[0].studentClass || '-')
      .replaceAll('{location}', visits_[0].locationId?.toUpperCase() || '-')
      .replaceAll('{items}', items)
  }

  const openWa = (visits) => {
    setTeacherName('')
    setTeacherPhone('')
    setWaTarget({ visits })
  }

  const sendWhatsApp = () => {
    if (!waTarget) return
    const name = teacherName.trim()
    const rawPhone = teacherPhone.trim()
    if (!name || !rawPhone) return
    const phone = normalizeWaNumber(rawPhone)
    if (phone.length < 8 || phone.length > 15) {
      showToast(t('active.waPhoneInvalid'), 'error')
      return
    }
    const msg = buildWaMessage(name)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    showToast(t('active.waSent'))
    setWaTarget(null)
    setTeacherName('')
    setTeacherPhone('')
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('active.eyebrow')} {activeLocation.toUpperCase()}</span>
          <h2>{t('active.title')}</h2>
          <p>{t('active.desc')}</p>
        </div>
        <div className="page-heading-action">
          <span className="live-sync-badge">
            <span className="live-pulse-dot online" />
            <span>{visits.filter((v) => v.status === 'ACTIVE').length} {t('common.active')}</span>
          </span>
        </div>
      </div>

      {isViewer && (
        <div className="alert warning" style={{ marginBottom: '16px' }}>
          <span dangerouslySetInnerHTML={{ __html: t('viewer.activeStudents') }} />
        </div>
      )}

      {error && (
        <div className="alert error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button className="btn-secondary" onClick={retryLoad} style={{ marginLeft: '12px', flexShrink: 0 }}>
            <RefreshCw size={14} /> {t('common.retry')}
          </button>
        </div>
      )}

      {waGroups.length > 0 && !isViewer && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          <span className="muted" style={{ fontSize: '13px', fontWeight: 700 }}>
            {t('active.waGroupTitle')}:
          </span>
          <div className="wa-scope-segmented" role="group" aria-label={t('active.waGroupTitle')}>
            <button type="button" className={waScope === 'all' ? 'active' : ''} onClick={() => setWaScope('all')}>
              {t('active.waScopeAll')}
            </button>
            <button type="button" className={waScope === 'unhandled' ? 'active' : ''} onClick={() => setWaScope('unhandled')}>
              {t('active.waScopeUnhandled')}
            </button>
            <button type="button" className={waScope === 'handled' ? 'active' : ''} onClick={() => setWaScope('handled')}>
              {t('active.waScopeHandled')}
            </button>
          </div>
          {waGroups.map((group) => (
            <button
              key={group.class}
              type="button"
              className="btn-small btn-wa"
              onClick={() => openWa(group.visits)}
              title={t('active.waGroupNotify')}
            >
              <MessageCircle size={14} /> {group.class} ({group.visits.length})
            </button>
          ))}
        </div>
      )}

      <div className="filter-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          className="filter-input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t('active.filterSearchPlaceholder')}
        />
        <select className="filter-input" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">{t('students.filterAllClasses')}</option>
          {classOptions.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t('active.filterAllStatus')}</option>
          <option value="pending">{t('visitTable.pending')}</option>
          <option value="in_treatment">{t('visitTable.inTreatment')}</option>
          <option value="treated">{t('visitTable.treated')}</option>
        </select>
        {(term || classFilter || statusFilter) && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setTerm(''); setClassFilter(''); setStatusFilter('') }}
          >
            <X size={16} /> {t('students.filterReset')}
          </button>
        )}
        {(term || classFilter || statusFilter) && (
          <span className="muted" style={{ fontSize: '13px' }}>
            {filteredVisits.length} {t('students.filterResult')}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="empty-state">
          <span className="live-pulse-dot online" />
          <strong>{t('common.loading')}</strong>
        </div>
      ) : (
        <VisitTable visits={filteredVisits} activeOnly onCheckOut={isViewer ? null : setTarget} onTreatment={isViewer ? null : openTreatment} onNotifyWA={isViewer ? null : openWa} />
      )}

      {target && !isViewer && (
        <div className="modal-backdrop">
          <div className="dialog">
            <h3>{t('active.confirmCheckout')}</h3>
            <p>
              {t('active.confirmCheckoutMsg')} <strong>{target.studentName}</strong>?
            </p>
            <div className="checkout-time-summary" style={{ margin: '14px 0', padding: '12px', background: 'var(--md-surface-2, #132B3D)', borderRadius: '8px', display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">{t('active.checkinTime')}</span>
                <strong>
                  {new Date(target.checkIn).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">{t('active.currentCheckoutTime') || 'Waktu Check-out Sekarang'}</span>
                <strong className="mono">{timeString} {t('common.wib')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--md-border, #1E3A4A)', paddingTop: '6px' }}>
                <span className="muted">{t('active.elapsedTime') || 'Total Durasi'}</span>
                <strong style={{ color: 'var(--md-primary, #14B8A6)' }}>{formatDuration(target.checkIn, now)}</strong>
              </div>
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setTarget(null)}
                disabled={busy}
              >
                {t('common.cancel')}
              </button>
              <button type="button" className="btn-primary" onClick={done} disabled={busy}>
                {busy ? t('common.processing') : t('active.checkoutBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {treatmentTarget && !isViewer && (
        <div className="modal-backdrop">
          <div className="dialog">
            <h3>{t('active.treatmentTitle')}</h3>
            <p>
              {t('active.treatmentMsg')} <strong>{treatmentTarget.studentName}</strong>
            </p>
            <div style={{ margin: '14px 0', display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                {t('active.treatmentStatusLabel')}
                <select
                  className="filter-input"
                  value={treatmentStatus}
                  onChange={(e) => setTreatmentStatus(e.target.value)}
                >
                  <option value="pending">{t('visitTable.pending')}</option>
                  <option value="in_treatment">{t('visitTable.inTreatment')}</option>
                  <option value="treated">{t('visitTable.treated')}</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                {t('active.treatmentNotesLabel')}
                <textarea
                  className="filter-input"
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  placeholder={t('active.treatmentNotesPlaceholder')}
                  rows="3"
                />
              </label>
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setTreatmentTarget(null)}
                disabled={busy}
              >
                {t('common.cancel')}
              </button>
              <button type="button" className="btn-primary" onClick={saveTreatment} disabled={busy}>
                {busy ? t('common.processing') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {waTarget && !isViewer && (
        <div className="modal-backdrop">
          <div className="dialog">
            <h3>{t('active.waTitle')}</h3>
            <p>
              {waSingle ? (
                <>
                  {t('active.waMsg')} <strong>{waVisits[0]?.studentName}</strong> ({waVisits[0]?.studentClass})
                </>
              ) : (
                <>
                  {t('active.waGroupMsg')} <strong>{waVisits[0]?.studentClass}</strong> ({waVisits.length} {t('common.active')})
                </>
              )}
            </p>
            <div style={{ margin: '14px 0', display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                {t('active.waTeacherName')}
                <input
                  className="filter-input"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder={t('active.waTeacherNamePlaceholder')}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                {t('active.waTeacherPhone')}
                <input
                  className="filter-input"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  placeholder={t('active.waTeacherPhonePlaceholder')}
                  type="tel"
                />
                {teacherPhone.trim().length > 0 && (
                  <small style={{ color: 'var(--md-muted, #8AA3B5)', fontWeight: 400 }}>
                    {t('active.waPhoneConverted')}: +{normalizeWaNumber(teacherPhone)}
                  </small>
                )}
              </label>
              <div style={{ padding: '10px', background: 'var(--md-surface-2, #132B3D)', borderRadius: '8px', fontSize: '12px' }}>
                <strong>{t('active.waPreview')}</strong>
                <p style={{ margin: '6px 0 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {buildWaMessage(teacherName)}
                </p>
              </div>
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setWaTarget(null); setTeacherName(''); setTeacherPhone('') }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn-primary btn-wa-send"
                onClick={sendWhatsApp}
                disabled={!teacherName.trim() || !teacherPhone.trim()}
              >
                <MessageCircle size={16} /> {t('active.waSendBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
