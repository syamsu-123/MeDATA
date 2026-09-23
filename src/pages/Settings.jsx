import { Building2, Code2, HeartPulse, Info, Moon, Sun, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { languages } from '../i18n'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { activeLocation, setActiveLocation } = useLocationContext()
  const { user, profile, role, isAdmin } = useAuth()
  const { t, lang, setLang } = useLanguage()

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('settings.eyebrow')}</span>
          <h2>{t('settings.title')}</h2>
          <p>{t('settings.desc')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '820px' }}>
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h3>{t('settings.appearance.title')}</h3>
              <p className="muted">{t('settings.appearance.desc')}</p>
            </div>
          </div>
          <div className="settings-list">
            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--md-border-soft)' }}>
              <div>
                <strong>{t('settings.theme.label')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {theme === 'dark' ? t('settings.theme.currentDark') : t('settings.theme.currentLight')}
                </p>
              </div>
              <button
                className="btn-secondary"
                onClick={toggleTheme}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {theme === 'dark' ? <><Sun size={16} /> {t('settings.theme.buttonLight')}</> : <><Moon size={16} /> {t('settings.theme.buttonDark')}</>}
              </button>
            </div>

            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--md-border-soft)' }}>
              <div>
                <strong>{t('settings.lang.label')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {t('settings.lang.desc')}
                </p>
              </div>
              <select
                className="input-field compact"
                style={{ width: 'auto' }}
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {Object.entries(languages).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.flag} {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <strong>{t('settings.location.label')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {t('settings.location.labelDesc')}
                </p>
              </div>
              <select
                className="input-field compact"
                style={{ width: 'auto' }}
                value={activeLocation}
                onChange={(e) => setActiveLocation(e.target.value)}
              >
                <option value="uks">{t('location.uks')}</option>
                <option value="kamar">{t('location.kamar')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h3>{t('settings.location.title')}</h3>
              <p className="muted">{t('settings.location.desc')}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--md-border)', background: 'var(--md-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="location-pill" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HeartPulse size={14} /> UKS
                </span>
                <strong>{t('settings.location.uks')}</strong>
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                {t('settings.location.uksDesc')}
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--md-border)', background: 'var(--md-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="location-pill" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={14} /> KAMAR
                </span>
                <strong>{t('settings.location.kamar')}</strong>
              </div>
              <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                {t('settings.location.kamarDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h3>{t('settings.account.title')}</h3>
              <p className="muted">{t('settings.account.desc')}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--md-border-soft)' }}>
              <span className="muted">{t('settings.account.name')}</span>
              <strong>{profile?.name || user?.displayName || t('role.petugas')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--md-border-soft)' }}>
              <span className="muted">{t('settings.account.email')}</span>
              <span>{user?.email || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--md-border-soft)' }}>
              <span className="muted">{t('settings.account.role')}</span>
              <span className="badge badge-active">{(role || 'petugas').toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted">{t('settings.account.uid')}</span>
              <small className="mono">{user?.uid || '—'}</small>
            </div>
          </div>

          {isAdmin && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--md-border-soft)' }}>
              <Link to="/users" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Users size={17} /> {t('settings.account.manageUsers')}
              </Link>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} /> {t('settings.about.title')}
              </h3>
              <p className="muted">{t('settings.about.desc')}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--md-border-soft)' }}>
              <img
                src="/medata-logo.svg"
                alt={t('app.name')}
                style={{ width: '62px', height: '62px', objectFit: 'contain', flexShrink: 0 }}
              />
              <div>
                <strong style={{ fontSize: '17px' }}>{t('settings.about.badge')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: '1.6' }}>
                  {t('settings.about.appDesc')}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--md-border-soft)' }}>
                <span className="muted">{t('settings.about.appName')}</span>
                <strong>{t('app.name')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--md-border-soft)' }}>
                <span className="muted">{t('settings.about.version')}</span>
                <span>v1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--md-border-soft)' }}>
                <span className="muted">{t('settings.about.tech')}</span>
                <span>React · Firebase · Vite</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                <span className="muted">{t('settings.about.developer')}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={15} /> {t('settings.about.team')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}