import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const LOCALE_MAP = {
  id: 'id-ID',
  en: 'en-US',
  ar: 'ar-SA',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
}

export function useRealtimeClock() {
  const { lang, t } = useLanguage()
  const [now, setNow] = useState(() => new Date())
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const locale = LOCALE_MAP[lang] || 'id-ID'

  const timeString = useMemo(
    () =>
      now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    [now, locale],
  )

  const timeShort = useMemo(
    () =>
      now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [now, locale],
  )

  const timeWithZone = useMemo(
    () => `${timeString} ${t('common.wib')}`,
    [timeString, t],
  )

  const dateString = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now),
    [now, locale],
  )

  const shortDateString = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(now),
    [now, locale],
  )

  const formatDuration = useMemo(
    () => (startTime, endTime = now) => {
      if (!startTime) return t('common.dash')
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()
      const diffMinutes = Math.max(0, Math.floor((end - start) / 60000))

      if (diffMinutes === 0) return t('visitTable.lessThanMinute')
      const hours = Math.floor(diffMinutes / 60)
      const rem = diffMinutes % 60
      if (hours > 0) {
        if (lang === 'en') return `${hours}h ${rem}m`
        return `${hours} ${t('visitTable.hours')} ${rem} ${t('visitTable.minutes')}`
      }
      return `${rem} ${t('visitTable.minutes')}`
    },
    [now, lang, t],
  )

  return {
    now,
    locale,
    timeString,
    timeShort,
    timeWithZone,
    dateString,
    shortDateString,
    isOnline,
    formatDuration,
  }
}
