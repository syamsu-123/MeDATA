import { useRef, useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
import DnaNetworkAnimation from '../components/DnaNetworkAnimation'

const message = (t, error, mode) => {
  if (
    error?.code === 'auth/invalid-credential' ||
    error?.code === 'auth/wrong-password' ||
    error?.code === 'auth/user-not-found' ||
    error?.code === 'auth/invalid-email'
  ) {
    return mode === 'register'
      ? t('login.invalidCredentialRegister')
      : t('login.invalidCredential')
  }
  if (error?.code === 'auth/email-already-in-use') return t('login.emailInUse')
  if (error?.code === 'auth/weak-password') return t('login.weakPassword')
  if (error?.code === 'auth/too-many-requests') return t('login.tooManyRequests')
  return mode === 'register'
    ? t('login.registerFailed')
    : t('login.loginFailed')
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
)

export default function ReferenceLogin() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const frontRef = useRef(null)
  const backRef = useRef(null)
  const promoRef = useRef(null)

  const handleAmbientMove = (event) => {
    const el = promoRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    el.style.setProperty('--mx', `${px * 22}px`)
    el.style.setProperty('--my', `${py * 16}px`)
  }

  const { login, register, loginWithGoogle, resetPassword } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const go = useNavigate()

  const mode = isRegister ? 'register' : 'login'

  const validateLogin = () => {
    const next = {}
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!email.trim()) next.email = t('login.enterEmailFirst')
    else if (!emailValid) next.email = t('login.invalidCredential')
    if (!password) next.password = t('login.enterPassword')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateRegister = () => {
    const next = {}
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!name.trim()) next.name = t('login.nameRequired')
    if (!email.trim()) next.email = t('login.enterEmailFirst')
    else if (!emailValid) next.email = t('login.invalidCredential')
    if (!password) next.password = t('login.enterPassword')
    if (password && password.length < 6) next.password = t('login.weakPassword')
    if (!confirm) next.confirm = t('login.confirmRequired')
    else if (confirm !== password) next.confirm = t('login.passMismatch')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    const ok = isRegister ? validateRegister() : validateLogin()
    if (!ok) return
    setBusy(true)
    try {
      if (isRegister) {
        await register(email, password, name)
        showToast(t('login.regSuccess'))
        go('/splash')
      } else {
        await login(email, password, remember)
        showToast(t('login.success'))
        go('/splash')
      }
    } catch (error) {
      showToast(message(t, error, mode), 'error')
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (target) => {
    if (target === mode) return
    setIsRegister(target === 'register')
    setErrors({})
    if (target === 'register') {
      window.setTimeout(() => backRef.current?.querySelector('input')?.focus(), 720)
    } else {
      window.setTimeout(() => frontRef.current?.querySelector('input')?.focus(), 720)
    }
  }

  const handleGoogleLogin = async () => {
    setBusy(true)
    try {
      const res = await loginWithGoogle(remember)
      if (res?.user) {
        showToast(`${t('login.successAs')} ${res.profile?.role?.toUpperCase() || 'USER'}`)
        go('/splash')
      }
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') {
        showToast(t('login.googlePopupClosed'), 'error')
      } else if (error?.code === 'auth/unauthorized-domain') {
        showToast(
          t('login.googleDomainError'),
          'error',
        )
      } else if (error?.code === 'auth/operation-not-allowed') {
        showToast(
          t('login.googleProviderError'),
          'error',
        )
      } else if (error?.code !== 'auth/cancelled-popup-request') {
        showToast(error.message || t('login.googleFailed'), 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  const forgotPassword = async () => {
    if (!email) {
      showToast(t('login.enterEmailFirst'), 'error')
      return
    }
    try {
      await resetPassword(email)
      showToast(t('login.resetSent'))
    } catch (error) {
      showToast(
        error?.code === 'auth/user-not-found'
          ? t('login.emailNotRegistered')
          : t('login.resetFailed'),
        'error',
      )
    }
  }

  const benefits = [
    [ShieldCheck, 'benefit1'],
    [Zap, 'benefit2'],
    [HeartPulse, 'benefit3'],
  ]

  return (
    <main className="reference-login">
      <section className="login-promo" ref={promoRef} onMouseMove={handleAmbientMove}>
        <div className="auth-bg" aria-hidden="true">
          <span className="auth-bg-glow auth-bg-glow--1" />
          <span className="auth-bg-glow auth-bg-glow--2" />
          <span className="auth-bg-orb auth-bg-orb--1" />
          <span className="auth-bg-orb auth-bg-orb--2" />
          <span className="auth-bg-orb auth-bg-orb--3" />
          <span className="auth-bg-grid" />
          <i className="auth-p" style={{ '--dx': '0' }} />
          <i className="auth-p" style={{ '--dx': '-40px' }} />
          <i className="auth-p" style={{ '--dx': '30px' }} />
          <i className="auth-p" style={{ '--dx': '-60px' }} />
          <i className="auth-p" style={{ '--dx': '50px' }} />
          <i className="auth-p" style={{ '--dx': '-20px' }} />
          <i className="auth-p" style={{ '--dx': '70px' }} />
          <i className="auth-p" style={{ '--dx': '15px' }} />
        </div>
        <DnaNetworkAnimation />
        <div className="login-promo-brand">
          <img src="/medata-logo.svg" alt={t('app.alt')} />
        </div>
        <div className="login-promo-copy">
          <em>{t('login.promo.eyebrow')}</em>
          <h1>
            {t('login.promo.h1a')}<br />
            <b>{t('login.promo.h1b')}</b>
            <br />
            {t('login.promo.h1c')}
          </h1>
          <p>
            {t('login.promo.p1')}
            <br />
            {t('login.promo.p2')}
          </p>
        </div>
        <div className="login-benefits">
          {benefits.map(([Icon, key]) => (
            <div key={key}>
              <span>
                <Icon size={21} />
              </span>
              <p>
                <strong>{t(`login.${key}.t`)}</strong>
                <small>{t(`login.${key}.d`)}</small>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="login-form-side">
        <button
          className="login-theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('login.toggleLight') : t('login.toggleDark')}
          title={theme === 'dark' ? t('login.toggleLight') : t('login.toggleDark')}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="auth-card-container">
          <div className={`auth-card${isRegister ? ' is-flipped' : ''}`}>
            <form
              className="reference-login-card auth-card-front"
              ref={frontRef}
              onSubmit={submit}
            >
              <div className="reference-login-heading">
                <span>
                  <LockKeyhole size={22} />
                </span>
                <em>{t('login.eyebrow')}</em>
                <h2>
                  {t('login.titleA')} <b>{t('app.name')}</b>
                </h2>
                <p>{t('login.subtitle')}</p>
              </div>

              <label>
                {t('login.email')}
                <div className={`login-input${errors.email ? ' has-error' : ''}`}>
                  <UserRound size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errors.email) setErrors((e) => ({ ...e, email: undefined }))
                    }}
                    placeholder={t('login.emailPh')}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>

              <label>
                {t('login.password')}
                <div className={`login-input${errors.password ? ' has-error' : ''}`}>
                  <LockKeyhole size={18} />
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }))
                    }}
                    placeholder={t('login.passwordPh')}
                  />
                  <button
                    type="button"
                    aria-label={t('login.showPassword')}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </label>

              <div className="login-options">
                <label>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  {t('login.remember')}
                </label>
                <button type="button" onClick={forgotPassword}>
                  {t('login.forgot')}
                </button>
              </div>

              <button className="reference-login-submit" disabled={busy}>
                {busy ? t('login.busy') : t('login.submit')}
                <ArrowRight size={19} />
              </button>

              <div className="login-divider">
                <span />
                {t('login.divider')}
                <span />
              </div>

              <button
                type="button"
                className="btn-google"
                onClick={handleGoogleLogin}
                disabled={busy}
              >
                <GoogleIcon />
                <span>{t('login.google')}</span>
              </button>

              <div className="login-switch">
                {t('login.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                >
                  {t('login.register')}
                </button>
              </div>

              <div className="login-security">
                <ShieldCheck size={18} />
                {t('login.security')}
              </div>
            </form>

            <form
              className="reference-login-card auth-card-back"
              ref={backRef}
              onSubmit={submit}
            >
              <div className="reference-login-heading">
                <span>
                  <UserRound size={22} />
                </span>
                <em>{t('login.registerEyebrow')}</em>
                <h2>
                  {t('login.registerTitle')} <b>{t('app.name')}</b>
                </h2>
                <p>{t('login.registerSubtitle')}</p>
              </div>

              <label>
                {t('login.name')}
                <div className={`login-input${errors.name ? ' has-error' : ''}`}>
                  <UserRound size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (errors.name) setErrors((e) => ({ ...e, name: undefined }))
                    }}
                    placeholder={t('login.namePh')}
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </label>

              <label>
                {t('login.email')}
                <div className={`login-input${errors.email ? ' has-error' : ''}`}>
                  <UserRound size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errors.email) setErrors((e) => ({ ...e, email: undefined }))
                    }}
                    placeholder={t('login.emailPh')}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>

              <label>
                {t('login.password')}
                <div className={`login-input${errors.password ? ' has-error' : ''}`}>
                  <LockKeyhole size={18} />
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }))
                    }}
                    placeholder={t('login.passwordPh')}
                  />
                  <button
                    type="button"
                    aria-label={t('login.showPassword')}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </label>

              <label>
                {t('login.confirm')}
                <div className={`login-input${errors.confirm ? ' has-error' : ''}`}>
                  <LockKeyhole size={18} />
                  <input
                    type={show ? 'text' : 'password'}
                    value={confirm}
                    onChange={(event) => {
                      setConfirm(event.target.value)
                      if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }))
                    }}
                    placeholder={t('login.confirmPh')}
                  />
                </div>
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
              </label>

              <button className="reference-login-submit" disabled={busy}>
                {busy ? t('login.busy') : t('login.registerBtn')}
                <ArrowRight size={19} />
              </button>

              <div className="login-divider">
                <span />
                {t('login.divider')}
                <span />
              </div>

              <button
                type="button"
                className="btn-google"
                onClick={handleGoogleLogin}
                disabled={busy}
              >
                <GoogleIcon />
                <span>{t('login.google')}</span>
              </button>

              <div className="login-switch">
                {t('login.haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                >
                  {t('login.toLogin')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <footer>© {new Date().getFullYear()} MeData. {t('login.footer')}</footer>
      </section>
    </main>
  )
}
