import { useEffect, useMemo, useState } from 'react'
import { Activity, Building2, HeartPulse, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'
import { subscribeAllVisits } from '../services/firestoreService'

const COLORS = ['var(--md-chart-primary)', 'var(--md-success)']

const LOCALE_MAP = { id: 'id-ID', en: 'en-US', ar: 'ar-SA', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' }

export default function Monitoring() {
  const { t, lang } = useLanguage()
  const locale = LOCALE_MAP[lang] || 'id-ID'
  const [visits, setVisits] = useState([])
  const [error, setError] = useState('')

  useEffect(() => subscribeAllVisits(setVisits, setError), [])

  const stats = useMemo(() => {
    const total = visits.length
    const uks = visits.filter((v) => v.locationId === 'uks').length
    const kamar = visits.filter((v) => v.locationId === 'kamar').length
    const active = visits.filter((v) => v.status === 'ACTIVE').length
    const completed = visits.filter((v) => v.status === 'COMPLETED').length

    const locData = [
      { name: 'UKS', total: uks, fill: 'var(--md-chart-secondary)' },
      { name: t('location.kamar').toUpperCase(), total: kamar, fill: 'var(--md-chart-amber)' },
    ]

    const statusData = [
      { name: t('monitoring.activeLabel'), value: active },
      { name: t('monitoring.completedLabel'), value: completed },
    ]

    return {
      total,
      uks,
      kamar,
      active,
      completed,
      locData,
      statusData,
    }
  }, [visits, t])

  return (
    <section className="page monitoring">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('monitoring.eyebrow')}</span>
          <h2>{t('monitoring.title')}</h2>
          <p>{t('monitoring.desc')}</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid" style={{ marginBottom: '22px' }}>
        <article className="stat-card">
          <div>
            <span>{t('monitoring.totalVisits')}</span>
            <strong>{stats.total}</strong>
            <small>{t('monitoring.combined')}</small>
          </div>
          <span className="stat-icon">
            <Users size={20} />
          </span>
        </article>

        <article className="stat-card">
          <div>
            <span>{t('monitoring.uksVisits')}</span>
            <strong>{stats.uks}</strong>
            <small>{stats.total ? Math.round((stats.uks / stats.total) * 100) : 0}{t('monitoring.percentOfTotal')}</small>
          </div>
          <span className="stat-icon">
            <HeartPulse size={20} />
          </span>
        </article>

        <article className="stat-card">
          <div>
            <span>{t('monitoring.kamarVisits')}</span>
            <strong>{stats.kamar}</strong>
            <small>{stats.total ? Math.round((stats.kamar / stats.total) * 100) : 0}{t('monitoring.percentOfTotal')}</small>
          </div>
          <span className="stat-icon">
            <Building2 size={20} />
          </span>
        </article>

        <article className="stat-card">
          <div>
            <span>{t('monitoring.activeStudents')}</span>
            <strong>{stats.active}</strong>
            <small>{t('monitoring.needsMonitoring')}</small>
          </div>
          <span className="stat-icon">
            <Activity size={20} />
          </span>
        </article>
      </div>

      <div className="chart-grid" style={{ marginBottom: '24px' }}>
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <h3>{t('monitoring.volumeComparison')}</h3>
              <p className="muted">{t('monitoring.volumeDesc')}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.locData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {stats.locData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '16px' }}>
            <div>
              <h3>{t('monitoring.statusProportion')}</h3>
              <p className="muted">{t('monitoring.statusDesc')}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats.statusData.map((_, i) => (
                  <Cell key={`pie-cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading" style={{ marginBottom: '14px' }}>
          <div>
            <h3>{t('monitoring.recentVisits')}</h3>
            <p className="muted">{t('monitoring.recentDesc')}</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('monitoring.colStudentName')}</th>
                <th>{t('monitoring.colClass')}</th>
                <th>{t('monitoring.colLocation')}</th>
                <th>{t('monitoring.colCheckinTime')}</th>
                <th>{t('monitoring.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {visits.slice(0, 10).map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.studentName}</strong>
                    <small>{v.nis || t('common.dash')}</small>
                  </td>
                  <td>{v.studentClass || t('common.dash')}</td>
                  <td>
                    <span className="location-pill">{v.locationId?.toUpperCase()}</span>
                  </td>
                  <td>
                    {v.checkIn
                      ? new Date(v.checkIn).toLocaleString(locale, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : t('common.dash')}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        v.status === 'ACTIVE' ? 'badge-active' : 'badge-complete'
                      }`}
                    >
                      {v.status === 'ACTIVE' ? t('common.active') : t('common.completed')}
                    </span>
                  </td>
                </tr>
              ))}
              {!visits.length && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <Activity size={28} />
                      <strong>{t('monitoring.noData')}</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
