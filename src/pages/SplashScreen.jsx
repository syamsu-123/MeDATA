import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function SplashScreen() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const go = useNavigate()
  const location = useLocation()
  const target = location.state?.redirectTo || '/dashboard'

  useEffect(() => {
    if (loading) return
    sessionStorage.setItem('medata_booted', 'true')
    const timer = setTimeout(() => go(user ? target : '/login', { replace: true, state: { fromSplash: true } }), 2450)
    return () => clearTimeout(timer)
  }, [loading, user, go, target])

  return (
    <main className="splash-screen">
      <div className="splash-grid" />
      <div className="splash-orbit splash-orbit-one" />
      <div className="splash-orbit splash-orbit-two" />
      <span className="splash-particle p1" />
      <span className="splash-particle p2" />
      <span className="splash-particle p3" />
      <section className="splash-content">
        <img className="splash-logo-image" src="/medata-logo.svg" alt={t('splash.alt')} />
        <p className="splash-label">{t('splash.label')}</p>
        <div className="splash-pulse"><span /><span /><span /></div>
        <h1>{t('splash.titleLine1')}<br /><b>{t('splash.titleLine2')}</b></h1>
        <p className="splash-copy">{t('splash.desc')}</p>
        <div className="splash-loader"><i /><span>{t('splash.loading')}</span></div>
      </section>
      <footer>© {new Date().getFullYear()} MeData · {t('splash.footer')}</footer>
    </main>
  )
}
