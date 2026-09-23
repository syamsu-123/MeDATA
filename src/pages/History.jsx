import { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, Clock3, Filter, Search, Trash2, X } from 'lucide-react'
import { useLocationContext } from '../context/LocationContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { removeVisit, removeVisits, subscribeVisits } from '../services/firestoreService'
import VisitTable from '../components/common/VisitTable'
import { useRealtimeClock } from '../hooks/useRealtimeClock'

export default function History() {
  const { activeLocation } = useLocationContext()
  const { t } = useLanguage()
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const { now } = useRealtimeClock()
  const [visits, setVisits] = useState([])
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('all') // 'all', 'today', 'week', 'month'
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(null)
  const [removingAll, setRemovingAll] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeVisits(activeLocation, setVisits, setError), [activeLocation])

  const filtered = useMemo(() => {
    const todayStr = now.toDateString()

    return visits.filter((v) => {
      if (v.status !== 'COMPLETED') return false

      const checkInDate = new Date(v.checkIn)
      if (period === 'today') {
        if (checkInDate.toDateString() !== todayStr) return false
      } else if (period === 'week') {
        const diffTime = Math.abs(now - checkInDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays > 7) return false
      } else if (period === 'month') {
        const diffTime = Math.abs(now - checkInDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays > 30) return false
      }

      if (!query) return true
      const searchTarget = `${v.studentName || ''} ${v.nis || ''} ${v.studentClass || ''} ${v.keluhan || ''} ${v.notes || ''}`.toLowerCase()
      return searchTarget.includes(query.toLowerCase())
    })
  }, [visits, query, period, now])

  const stats = useMemo(() => {
    const completedVisits = visits.filter((v) => v.status === 'COMPLETED')
    const totalDuration = completedVisits.reduce((acc, curr) => acc + (curr.duration || 0), 0)
    const avgDuration = completedVisits.length ? Math.round(totalDuration / completedVisits.length) : 0
    const todayCount = completedVisits.filter(
      (v) => new Date(v.checkIn).toDateString() === now.toDateString(),
    ).length

    return {
      total: completedVisits.length,
      avgDuration: avgDuration > 60 ? `${Math.floor(avgDuration / 60)}h ${avgDuration % 60}m` : `${avgDuration}m`,
      todayCount,
    }
  }, [visits, now])

  const openDelete = (visit) => {
    if (!canWrite) return showToast(t('history.noPermission'), 'error')
    setRemoving(visit)
  }

  const confirmDelete = async () => {
    if (!removing) return
    setBusy(true)
    try {
      await removeVisit(removing.id)
      showToast(t('history.deleteSuccess'))
    } catch {
      showToast(t('history.deleteFailed'), 'error')
    } finally {
      setBusy(false)
      setRemoving(null)
    }
  }

  const openDeleteAll = () => {
    if (!canWrite) return showToast(t('history.noPermission'), 'error')
    if (!visits.some((v) => v.status === 'COMPLETED')) return
    setRemovingAll(true)
  }

  const confirmDeleteAll = async () => {
    setBusy(true)
    try {
      const ids = visits.filter((v) => v.status === 'COMPLETED').map((v) => v.id)
      await removeVisits(ids)
      showToast(t('history.deleteAllSuccess'))
    } catch {
      showToast(t('history.deleteFailed'), 'error')
    } finally {
      setBusy(false)
      setRemovingAll(false)
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('history.eyebrow')} {activeLocation.toUpperCase()}</span>
          <h2>{t('history.title')}</h2>
          <p>{t('history.desc')}</p>
        </div>
        {canWrite && visits.some((v) => v.status === 'COMPLETED') && (
          <button className="btn-danger" onClick={openDeleteAll}>
            <Trash2 size={17} /> {t('history.deleteAll')}
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <article className="stat-card">
          <div>
            <span>{t('history.totalCompleted')}</span>
            <strong>{stats.total}</strong>
            <small>{t('history.allHistory')} {activeLocation.toUpperCase()}</small>
          </div>
          <span className="stat-icon">
            <CheckCircle2 size={20} />
          </span>
        </article>
        <article className="stat-card">
          <div>
            <span>{t('history.completedToday')}</span>
            <strong>{stats.todayCount}</strong>
            <small>{t('history.todayService')}</small>
          </div>
          <span className="stat-icon">
            <Calendar size={20} />
          </span>
        </article>
        <article className="stat-card">
          <div>
            <span>{t('history.avgDuration')}</span>
            <strong>{stats.avgDuration}</strong>
            <small>{t('history.durationDesc')}</small>
          </div>
          <span className="stat-icon">
            <Clock3 size={20} />
          </span>
        </article>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div className="search-input" style={{ flex: '1 1 260px' }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('history.searchPlaceholder')}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} className="muted" />
          <select
            className="filter-input"
            style={{ marginBottom: 0, width: 'auto' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="all">{t('history.allTime')}</option>
            <option value="today">{t('history.today')}</option>
            <option value="week">{t('history.last7Days')}</option>
            <option value="month">{t('history.last30Days')}</option>
          </select>
        </div>
      </div>

      <VisitTable visits={filtered} onDelete={canWrite ? openDelete : undefined} />

      {removing && (
        <div className="modal-backdrop">
          <div className="dialog">
            <div className="dialog-head">
              <h3>{t('history.deleteHistory')}</h3>
              <button type="button" className="dialog-close" onClick={() => setRemoving(null)} aria-label={t('common.close')}>
                <X size={18} />
              </button>
            </div>
            <p className="muted" style={{ margin: '0', lineHeight: '1.6' }}>
              {t('history.deleteConfirmMsg')} <strong style={{ color: 'inherit' }}>{removing.studentName}</strong>{t('history.deleteConfirmSuffix')}
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={() => setRemoving(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn-danger" onClick={confirmDelete} disabled={busy}>
                <Trash2 size={16} /> {busy ? t('common.processing') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {removingAll && (
        <div className="modal-backdrop">
          <div className="dialog">
            <div className="dialog-head">
              <h3>{t('history.deleteAll')}</h3>
              <button type="button" className="dialog-close" onClick={() => setRemovingAll(false)} aria-label={t('common.close')}>
                <X size={18} />
              </button>
            </div>
            <p className="muted" style={{ margin: '0', lineHeight: '1.6' }}>
              {t('history.deleteAllConfirmMsg')} <strong style={{ color: 'inherit' }}>{visits.filter((v) => v.status === 'COMPLETED').length}</strong>?
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={() => setRemovingAll(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn-danger" onClick={confirmDeleteAll} disabled={busy}>
                <Trash2 size={16} /> {busy ? t('common.processing') : t('history.deleteAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
