import { lazy, Suspense } from 'react'; import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import AppLayout from '../components/AnimatedLayout'
import Login from '../pages/ReferenceLogin'
import SplashScreen from '../pages/SplashScreen'
import Dashboard from '../pages/ReferenceDashboard'
import Students from '../pages/Students'
import CheckIn from '../pages/CheckIn'
import ActiveStudents from '../pages/ActiveStudents'
import History from '../pages/History'
import Settings from '../pages/Settings'
import UserManagement from '../pages/UserManagement'

const Monitoring = lazy(() => import('../pages/Monitoring'))

function LoginGate() {
  const location = useLocation()
  const hasBooted = typeof window !== 'undefined' && sessionStorage.getItem('medata_booted')
  if (location.state?.fromSplash || hasBooted) return <Login />
  return <Navigate to="/splash" replace state={{ redirectTo: '/login' }} />
}

function Protected({ children, admin = false }) {
  const { user, profile, loading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const hasBooted = typeof window !== 'undefined' && sessionStorage.getItem('medata_booted')

  if (loading) return <div className="loading-screen">{t('routes.loadingApp')}</div>
  if (!user) return <Navigate to="/login" replace />
  if (!hasBooted) {
    return <Navigate to="/splash" replace state={{ redirectTo: location.pathname }} />
  }
  if (admin && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function AppRoutes() {
  const { t } = useLanguage()
  const wrap = (page, admin = false) => <Protected admin={admin}>{page}</Protected>
  return (
    <Suspense fallback={<div className="loading-screen">{t('routes.loadingPage')}</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<LoginGate />} />
        <Route path="/dashboard" element={wrap(<Dashboard />)} />
        <Route path="/check-in" element={wrap(<CheckIn />)} />
        <Route path="/active-students" element={wrap(<ActiveStudents />)} />
        <Route path="/check-out" element={<Navigate to="/active-students" replace />} />
        <Route path="/students" element={wrap(<Students />)} />
        <Route path="/history" element={wrap(<History />)} />
        <Route path="/monitoring" element={wrap(<Monitoring />, true)} />
        <Route path="/locations" element={wrap(<Settings />)} />
        <Route path="/users" element={wrap(<UserManagement />, true)} />
        <Route path="/settings" element={wrap(<Settings />)} />
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </Suspense>
  )
}
