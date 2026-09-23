import { Clock3, LogOut, Trash2, Stethoscope, MessageCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useRealtimeClock } from '../../hooks/useRealtimeClock'

const LOCALE_MAP = { id: 'id-ID', en: 'en-US', ar: 'ar-SA', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' }

export default function VisitTable({ visits, activeOnly = false, onCheckOut, onDelete, onTreatment, onNotifyWA }) {
  const { t, lang } = useLanguage()
  const { now, formatDuration } = useRealtimeClock()
  const locale = LOCALE_MAP[lang] || 'id-ID'

  const fmt = (value) =>
    value
      ? new Date(value).toLocaleString(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : t('common.dash')

  const dur = (minutes) => {
    if (minutes == null) return t('common.dash')
    if (minutes === 0) return t('visitTable.lessThanMinute')
    const hours = Math.floor(minutes / 60)
    const rem = minutes % 60
    if (hours > 0) {
      if (lang === 'en') return `${hours}h ${rem}m`
      return `${hours} ${t('visitTable.hours')} ${rem} ${t('visitTable.minutes')}`
    }
    return `${rem} ${t('visitTable.minutes')}`
  }

  const items = activeOnly ? visits.filter((v) => v.status === 'ACTIVE') : visits

  if (!items.length) {
    return (
      <div className="empty-state">
        <Clock3 size={28} />
        <strong>{activeOnly ? t('visitTable.noActiveStudents') : t('visitTable.noHistory')}</strong>
        <span>{t('visitTable.emptyDesc')}</span>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t('visitTable.colStudent')}</th>
            <th>{t('visitTable.colClass')}</th>
            <th>{t('visitTable.colLocation')}</th>
            <th>{t('visitTable.colCheckin')}</th>
            <th>{t('visitTable.colCheckout')}</th>
            <th>{t('visitTable.colDuration')}</th>
            <th>{t('visitTable.colNotes')}</th>
            <th>{t('visitTable.colStatus')}</th>
            {onTreatment && <th>{t('visitTable.colTreatment')}</th>}
            {onNotifyWA && <th>{t('visitTable.colNotify')}</th>}
            {onCheckOut && <th />}
            {onDelete && <th />}
          </tr>
        </thead>
        <tbody>
          {items.map((visit) => (
            <tr key={visit.id}>
              <td>
                <strong>{visit.studentName}</strong>
                <small>{visit.nis || t('common.dash')}</small>
              </td>
              <td>{visit.studentClass || t('common.dash')}</td>
              <td>
                <span className="location-pill">{visit.locationId?.toUpperCase()}</span>
              </td>
              <td>{fmt(visit.checkIn)}</td>
              <td>
                {visit.status === 'ACTIVE' ? (
                  <span className="muted" style={{ fontStyle: 'italic', fontSize: '12px' }}>
                    {t('visitTable.stillActive')}
                  </span>
                ) : (
                  fmt(visit.checkOut)
                )}
              </td>
              <td>
                {visit.status === 'ACTIVE' ? (
                  <span className="live-duration-badge" title={t('visitTable.ongoing')}>
                    <span className="live-pulse-dot online" />
                    <span>{formatDuration(visit.checkIn, now)}</span>
                  </span>
                ) : (
                  dur(visit.duration)
                )}
              </td>
              <td>{(visit.keluhan || visit.notes) ? <span>{visit.keluhan || visit.notes}</span> : <small className="muted">{t('common.dash')}</small>}</td>
              <td>
                <span
                  className={`badge ${
                    visit.status === 'ACTIVE' ? 'badge-active' : 'badge-complete'
                  }`}
                >
                  {visit.status === 'ACTIVE' ? t('common.active') : t('common.completed')}
                </span>
              </td>
              {onTreatment && (
                <td>
                  {visit.status === 'ACTIVE' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className={`badge ${
                          visit.treatmentStatus === 'treated'
                            ? 'badge-treated'
                            : visit.treatmentStatus === 'in_treatment'
                              ? 'badge-in-treatment'
                              : 'badge-pending'
                        }`}
                      >
                        {visit.treatmentStatus === 'treated'
                          ? t('visitTable.treated')
                          : visit.treatmentStatus === 'in_treatment'
                            ? t('visitTable.inTreatment')
                            : t('visitTable.pending')}
                      </span>
                      <button className="btn-small" onClick={() => onTreatment(visit)} title={t('visitTable.updateTreatment')}>
                        <Stethoscope size={14} />
                      </button>
                    </div>
                  )}
                </td>
              )}
              {onNotifyWA && visit.status === 'ACTIVE' && (
                <td>
                  <button className="btn-small btn-wa" onClick={() => onNotifyWA([visit])} title={t('visitTable.notifyTeacher')}>
                    <MessageCircle size={14} /> WA
                  </button>
                </td>
              )}
              {onCheckOut && (
                <td>
                  <button className="btn-small" onClick={() => onCheckOut(visit)}>
                    <LogOut size={14} /> {t('visitTable.checkoutBtn')}
                  </button>
                </td>
              )}
              {onDelete && (
                <td>
                  <button className="btn-small btn-danger-ghost" onClick={() => onDelete(visit)} aria-label={t('common.delete')}>
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
