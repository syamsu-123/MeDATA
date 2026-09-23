export const toDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (value.seconds) return new Date(value.seconds * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const getPatientStats = (patients, date = new Date()) => {
  const today = date.toISOString().slice(0, 10)
  return {
    total: patients.length,
    active: patients.filter((patient) => patient.status === 'aktif').length,
    completed: patients.filter((patient) => patient.status === 'selesai').length,
    today: patients.filter((patient) => toDate(patient.createdAt)?.toISOString().slice(0, 10) === today).length,
    kamar: patients.filter((patient) => patient.location === 'kamar').length,
    uks: patients.filter((patient) => patient.location === 'uks').length,
  }
}
