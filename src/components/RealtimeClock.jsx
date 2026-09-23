import { Clock, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeClock } from '../hooks/useRealtimeClock'
import { useLanguage } from '../context/LanguageContext'

export default function RealtimeClock({ compact = false }) {
  const { timeString, timeWithZone, shortDateString, dateString, isOnline } = useRealtimeClock()
  const { t } = useLanguage()

  const statusTitle = isOnline
    ? t('clock.onlineTooltip') || 'Online • Sinkronisasi Real-Time Aktif'
    : t('clock.offlineTooltip') || 'Offline • Data akan disinkronkan saat terhubung'

  return (
    <div className={`topbar-clock-widget ${compact ? 'compact' : ''}`} title={`${dateString} • ${statusTitle}`}>
      <div className="topbar-clock-main">
        <span
          className={`live-pulse-dot ${isOnline ? 'online' : 'offline'}`}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
        <Clock size={14} className="clock-icon" />
        <span className="clock-digits mono">{timeString}</span>
        <span className="clock-tz">{t('common.wib')}</span>
      </div>
      {!compact && (
        <span className="topbar-clock-sub">{shortDateString}</span>
      )}
    </div>
  )
}
