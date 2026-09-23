import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MapPin,
  PackageOpen,
  TrendingUp,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useLanguage } from '../context/LanguageContext'
import { subscribeVisits } from '../services/firestoreService'
import { useRealtimeClock } from '../hooks/useRealtimeClock'

const LOCALE_MAP = { id: 'id-ID', en: 'en-US', ar: 'ar-SA', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' }

export default function ReferenceDashboard() {
  const { activeLocation } = useLocationContext()
  const { profile, role, isViewer, canWrite } = useAuth()
  const { t, lang } = useLanguage()
  const { timeWithZone, dateString, now } = useRealtimeClock()
  const [visits, setVisits] = useState([])
  const [error, setError] = useState('')
  const locale = LOCALE_MAP[lang] || 'id-ID'

  useEffect(() => subscribeVisits(activeLocation, setVisits, setError), [activeLocation])

  const d = useMemo(() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(
      (_, i) => t(`day.${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][i]}`),
    )
    const today = now.toDateString()
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - 6 + i)
      return {
        name: dayNames[date.getDay()],
        total: visits.filter((v) => new Date(v.checkIn).toDateString() === date.toDateString()).length,
      }
    })
    const active = visits.filter((v) => v.status === 'ACTIVE').length
    const completed = visits.filter((v) => v.status === 'COMPLETED').length
    return {
      week,
      active,
      in: visits.filter((v) => new Date(v.checkIn).toDateString() === today).length,
      out: visits.filter((v) => v.checkOut && new Date(v.checkOut).toDateString() === today).length,
      total: visits.length,
      completed,
    }
  }, [visits, t, now])

  const stats = [
    ['cyan', t('dashboard.activeStudents'), d.active, t('dashboard.atLocation'), UsersRound],
    ['blue', t('dashboard.checkinToday'), d.in, t('dashboard.thisLocation'), CalendarDays],
    ['purple', t('dashboard.checkoutToday'), d.out, t('dashboard.thisLocation'), CheckCircle2],
    ['gold', t('dashboard.totalVisits'), d.total, t('dashboard.thisLocation'), UserRound],
  ]

  return (
    <section className="ref-dashboard">
      <div className="ref-dashboard-top">
        <div>
          <span className="ref-kicker">{t('dashboard.locationSummary')} {activeLocation.toUpperCase()}</span>
        </div>
        {canWrite && (
          <Link className="ref-checkin" to="/check-in">
            <ClipboardCheck size={18} />
            {t('dashboard.checkinStudent')}
          </Link>
        )}
      </div>

      {isViewer && (
        <div className="alert warning" style={{ marginBottom: '18px' }}>
          <span dangerouslySetInnerHTML={{ __html: t('viewer.dashboard') }} />
        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      <div className="ref-layout">
        <div className="ref-main">
          <div className="ref-stats">
            {stats.map(([tone, label, value, caption, Icon]) => (
              <article className={`ref-stat ${tone}`} key={label}>
                <div className="ref-stat-icon">
                  <Icon size={28} />
                </div>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{caption}</small>
                  <em>
                    <span className="live-pulse-dot online" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                    <TrendingUp size={12} /> Live <i>{t('dashboard.liveTracked')}</i>
                  </em>
                </div>
              </article>
            ))}
          </div>

          <section className="ref-active-card">
            <header>
              <div>
                <h3>
                  <b /> {t('dashboard.currentlyActive')}
                </h3>
                <p>{t('dashboard.activeStudentsDesc')}</p>
              </div>
              <Link to="/active-students">{t('dashboard.viewAll')}</Link>
            </header>
            {d.active ? (
              <div className="ref-active-list">
                {visits
                  .filter((v) => v.status === 'ACTIVE')
                  .slice(0, 5)
                  .map((v) => (
                    <div key={v.id}>
                      <span>{v.studentName?.[0]}</span>
                      <strong>{v.studentName}</strong>
                      <small>{v.studentClass}</small>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="ref-empty">
                <PackageOpen size={73} />
                <h3>{t('dashboard.noActiveStudents')}</h3>
                <p>{t('dashboard.noActiveStudentsDesc')}</p>
              </div>
            )}
          </section>

          <section className="ref-weekly">
            <header>
              <h3>{t('dashboard.weeklySummary')}</h3>
              <p>{t('dashboard.weeklySummaryDesc')}</p>
            </header>
            <div>
              {[
                [t('dashboard.avgPerDay'), Math.round(d.total / 7), t('dashboard.visits'), CalendarDays],
                [t('dashboard.highestDay'), Math.max(0, ...d.week.map((x) => x.total)), t('dashboard.visits'), TrendingUp],
                [t('dashboard.weeklyTotal'), d.total, t('dashboard.visits'), UsersRound],
                [t('common.status'), `${d.active} ${t('dashboard.activeStatus')}`, t('dashboard.beingTreated'), Activity],
              ].map(([l, v, s, I]) => (
                <article key={l}>
                  <span>
                    <I size={20} />
                  </span>
                  <div>
                    <small>{l}</small>
                    <strong>{v}</strong>
                    <em>{s}</em>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="ref-side">
          <section className="ref-chart-card">
            <header>
              <h3>{t('dashboard.visitChart')}</h3>
              <span>{t('dashboard.last7Days')}</span>
            </header>
            <ResponsiveContainer width="100%" height={185}>
              <AreaChart data={d.week}>
                <defs>
                  <linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--md-chart-primary)" stopOpacity=".4" />
                    <stop offset="1" stopColor="var(--md-chart-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--md-chart-primary)"
                  strokeWidth={2}
                  fill="url(#visitFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="ref-activity">
            <h3>{t('dashboard.recentActivity')}</h3>
            {[
              ['cyan', t('dashboard.newCheckin'), d.in],
              ['purple', t('dashboard.newCheckout'), d.out],
              ['blue', t('dashboard.activeStudentsLabel'), d.active],
            ].map(([tone, l, n]) => (
              <div key={l}>
                <span className={tone}>
                  <Activity size={15} />
                </span>
                <p>
                  <strong>{l}</strong>
                  <small>{n ? t('dashboard.activityToday') : t('dashboard.noActivity')}</small>
                </p>
                <b>{n || '–'}</b>
              </div>
            ))}
          </section>

          <section className="ref-info">
            <h3>{t('dashboard.locationInfo')}</h3>
            {[
              [MapPin, t('dashboard.locationLabel'), activeLocation.toUpperCase()],
              [UserRound, t('dashboard.userLabel'), profile?.name || role || t('role.petugas')],
              [CalendarDays, t('dashboard.dateLabel'), dateString],
              [Clock, t('dashboard.timeLabel'), timeWithZone],
            ].map(([I, l, v]) => (
              <div key={l}>
                <I size={18} />
                <span>{l}</span>
                <b className={I === Clock ? 'mono' : ''}>{v}</b>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </section>
  )
}
