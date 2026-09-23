import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import AppGuide from './AppGuide'
import LanguageSelector from './LanguageSelector'
import RealtimeClock from './RealtimeClock'

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/check-in', labelKey: 'nav.checkin', icon: ClipboardList, requiresWrite: true },
  { to: '/active-students', labelKey: 'nav.activeStudents', icon: Activity },
  { to: '/students', labelKey: 'nav.students', icon: Users },
  { to: '/history', labelKey: 'nav.history', icon: BookOpen },
  { to: '/monitoring', labelKey: 'nav.monitoring', icon: Activity, adminOnly: true },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

export default function AnimatedLayout({ children }) {
  const { user, profile, role, isViewer, isAdmin, logout } = useAuth()
  const { activeLocation, setActiveLocation } = useLocationContext()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const go = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const bootRedirectDone = useRef(false)
  const close = () => setMobileOpen(false)

  useEffect(() => {
    if (!user) return
    if (!bootRedirectDone.current) {
      bootRedirectDone.current = true
      if (location.pathname !== '/dashboard') {
        go('/dashboard', { replace: true })
      }
    }
    setShowGuide(true)
  }, [user])

  const finishGuide = () => setShowGuide(false)

  const handleLogout = async () => {
    setLogoutOpen(false)
    sessionStorage.setItem('medata_booted', 'true')
    await logout()
    go('/login', { replace: true })
  }

  const visibleNav = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.requiresWrite && isViewer) return false
    return true
  })

  return (
    <div className={`app-shell medata-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`} onClick={close} />
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand-row">
          <NavLink className="brand" to="/dashboard" onClick={close}>
            <img className="brand-mark" src="/medata-icon.svg" alt={t('app.name')} />
            <strong>
              {t('app.name')}
              <small>{t('app.tag')}</small>
            </strong>
          </NavLink>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={t('topbar.toggleSidebar')}
          >
            {collapsed ? <Menu size={17} /> : <X size={17} />}
          </button>
        </div>
        <nav>
          {visibleNav.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              title={t(labelKey)}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon size={17} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="nav-link logout"
          onClick={() => setLogoutOpen(true)}
          title={t('nav.logout')}
        >
          <LogOut size={17} />
          <span>{t('nav.logout')}</span>
        </button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-brand">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('topbar.openMenu')}
            >
              <Menu size={21} />
            </button>
            <div>
              <span className="eyebrow">{t('topbar.eyebrow')}</span>
              <h1>{t('app.name')}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <RealtimeClock />
            <label className="location-switch">
              <MapPin size={15} />
              <select value={activeLocation} onChange={(e) => setActiveLocation(e.target.value)}>
                <option value="uks">{t('location.uks')}</option>
                <option value="kamar">{t('location.kamar')}</option>
              </select>
            </label>
            <LanguageSelector />
            <button className="icon-button" onClick={toggleTheme} aria-label={t('topbar.toggleTheme')}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="user-chip">
              <span>{(profile?.name || user?.email || 'A')[0].toUpperCase()}</span>
              <div>
                <strong>{profile?.name || t('role.petugas')}</strong>
                <small>{t(`role.${role || 'petugas'}`)}</small>
              </div>
            </div>
          </div>
        </header>
        <div className="page-transition" key={location.pathname}>
          {children}
        </div>
      </main>
      <AppGuide open={showGuide} onClose={finishGuide} />
      {logoutOpen && (
        <div className="guide-overlay" role="dialog" aria-modal="true" aria-label={t('logout.confirmTitle')}>
          <div className="guide-card confirm-card">
            <button className="guide-close" type="button" onClick={() => setLogoutOpen(false)} aria-label={t('common.close')}>
              <X size={18} />
            </button>
            <div className="confirm-icon">
              <LogOut size={26} />
            </div>
            <h3>{t('logout.confirmTitle')}</h3>
            <p>{t('logout.confirmMessage')}</p>
            <div className="confirm-actions">
              <button className="guide-skip" type="button" onClick={() => setLogoutOpen(false)}>
                {t('logout.cancel')}
              </button>
              <button className="confirm-danger" type="button" onClick={handleLogout}>
                {t('logout.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
