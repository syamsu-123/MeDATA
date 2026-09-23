import { useEffect, useState } from 'react'
import { Activity, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
import {
  subscribeActivityLogs,
  subscribeUsers,
  updateUserRole,
} from '../services/firestoreService'

const LOCALE_MAP = { id: 'id-ID', en: 'en-US', ar: 'ar-SA', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' }

export default function UserManagement() {
  const { isAdmin, user: currentUser } = useAuth()
  const { showToast } = useToast()
  const { t, lang } = useLanguage()
  const locale = LOCALE_MAP[lang] || 'id-ID'
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'logs'
  const [error, setError] = useState('')
  const [busyUser, setBusyUser] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    const unsubUsers = subscribeUsers(setUsers, setError)
    const unsubLogs = subscribeActivityLogs(setLogs, setError)
    return () => {
      unsubUsers()
      unsubLogs()
    }
  }, [isAdmin])

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?.uid && newRole !== 'admin') {
      if (!confirm(t('users.roleChangeWarning'))) {
        return
      }
    }
    setBusyUser(userId)
    try {
      await updateUserRole(userId, newRole)
      showToast(`${t('users.roleChangeSuccess')} ${newRole.toUpperCase()}.`)
    } catch (err) {
      showToast(err.message || t('users.roleChangeFailed'), 'error')
    } finally {
      setBusyUser(null)
    }
  }

  const roleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge badge-active'
      case 'petugas':
        return 'badge badge-complete'
      case 'viewer':
        return 'badge'
      default:
        return 'badge'
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('users.eyebrow')}</span>
          <h2>{t('users.title')}</h2>
          <p>{t('users.desc')}</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <button
          className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> {t('users.tabUsers')} ({users.length})
        </button>
        <button
          className={activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('logs')}
        >
          <Activity size={16} /> {t('users.tabLogs')} ({logs.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h3>{t('users.registeredUsers')}</h3>
              <p className="muted">{t('users.registeredDesc')}</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('users.colNameEmail')}</th>
                  <th>{t('users.colUserId')}</th>
                  <th>{t('users.colCurrentRole')}</th>
                  <th>{t('users.colChangeRole')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name || u.displayName || t('users.noName')}</strong>
                      <small>{u.email || u.id}</small>
                    </td>
                    <td>
                      <small className="mono">{u.id}</small>
                    </td>
                    <td>
                      <span className={roleBadgeClass(u.role || 'petugas')}>
                        {(u.role || 'petugas').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <select
                        className="input-field compact"
                        value={u.role || 'petugas'}
                        disabled={busyUser === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="admin">{t('users.roleAdmin')}</option>
                        <option value="petugas">{t('users.rolePetugas')}</option>
                        <option value="viewer">{t('users.roleViewer')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan="4">
                      <div className="empty-state">
                        <Users size={28} />
                        <strong>{t('users.emptyUsers')}</strong>
                        <span>{t('users.emptyUsersHint')}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h3>{t('users.auditTrail')}</h3>
              <p className="muted">{t('users.auditDesc')}</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('users.colTime')}</th>
                  <th>{t('users.colAction')}</th>
                  <th>{t('users.colDescription')}</th>
                  <th>{t('users.colUserIdShort')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      {log.createdAt?.toDate
                        ? log.createdAt.toDate().toLocaleString(locale, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : t('users.justNow')}
                    </td>
                    <td>
                      <span className="location-pill">{log.action || 'ACTIVITY'}</span>
                    </td>
                    <td>
                      <strong>{log.description}</strong>
                    </td>
                    <td>
                      <small className="mono">{log.userId}</small>
                    </td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan="4">
                      <div className="empty-state">
                        <Activity size={28} />
                        <strong>{t('users.noLogs')}</strong>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
