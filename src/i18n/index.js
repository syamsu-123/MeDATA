import id from './translations/id.js'
import en from './translations/en.js'
import ar from './translations/ar.js'
import ja from './translations/ja.js'
import ko from './translations/ko.js'
import zh from './translations/zh.js'

export const languages = {
  id: { label: 'Indonesia', flag: '\uD83C\uDDEE\uD83C\uDDE9' },
  en: { label: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  ar: { label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  ja: { label: '\u65E5\u672C\u8A9E', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  ko: { label: '\uD55C\uAD6D\uC5B4', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  zh: { label: '\u4E2D\u6587', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
}

export const translations = { id, en, ar, ja, ko, zh }

export const RTL_LANGUAGES = ['ar']
