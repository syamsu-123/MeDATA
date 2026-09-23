import * as XLSX from 'xlsx'

const toKey = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[\s_\-()./]/g, '')

const HEADER_MATCHERS = [
  { field: 'nis', matchers: ['nis'] },
  { field: 'nisn', matchers: ['nisn'] },
  { field: 'name', matchers: ['nama', 'name'] },
  { field: 'class', matchers: [/kelas/, 'class'] },
  { field: 'gender', matchers: ['gender', 'jk', /kelamin/] },
  { field: 'phone', matchers: ['telepon', 'phone', 'telp', 'nohp', 'nomorhp', 'hp', 'handphone'] },
]

const pickColumns = (headers) => {
  const keys = headers.map(toKey)
  const columns = {}
  for (const { field, matchers } of HEADER_MATCHERS) {
    for (let i = 0; i < keys.length; i++) {
      const matches = matchers.some(
        (matcher) => (typeof matcher === 'string' ? keys[i] === matcher : matcher.test(keys[i])),
      )
      if (matches) {
        columns[field] = i
        break
      }
    }
  }
  return columns
}

export const normalizeGender = (value) => {
  const key = toKey(value)
  if (!key) return ''
  if (['l', 'laki', 'lakilaki', 'laki-laki', 'male', 'pria', 'lanang'].includes(key) || key.startsWith('laki')) {
    return 'Laki-laki'
  }
  if (['p', 'perempuan', 'female', 'wanita', 'cewek'].includes(key) || key.startsWith('perempuan')) {
    return 'Perempuan'
  }
  return ''
}

export async function parseStudentsFile(file) {
  const lowercase = file.name.toLowerCase()
  let workbook
  if (lowercase.endsWith('.csv')) {
    workbook = XLSX.read(await file.text(), { type: 'string' })
  } else {
    workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  const headers = (grid[0] || []).map((header) => String(header ?? '').trim())
  const columns = pickColumns(headers)
  const problems = []
  if (!Object.keys(columns).length) {
    problems.push(
      'Tidak ditemukan judul kolom yang dikenali. Gunakan templat: nis | nisn | nama | kelas | gender | telepon.',
    )
    return { rows: [], problems }
  }
  const rows = []
  for (let i = 1; i < grid.length; i++) {
    const line = grid[i]
    const read = (field) =>
      columns[field] !== undefined ? String(line[columns[field]] ?? '').trim() : ''
    const nis = read('nis')
    const nisn = read('nisn')
    const name = read('name')
    const classValue = read('class')
    const gender = normalizeGender(read('gender'))
    const phone = read('phone')
    if (!nis && !nisn && !name && !classValue && !read('gender') && !phone) continue
    const messages = []
    if (!nis) messages.push('NIS kosong')
    if (!name) messages.push('Nama kosong')
    if (!classValue) messages.push('Kelas kosong')
    if (!gender) messages.push('Gender tidak dikenali')
    rows.push({
      nis,
      nisn,
      name,
      class: classValue,
      gender,
      phone,
      ok: messages.length === 0,
      messages,
    })
  }
  return { rows, problems }
}

export function downloadStudentTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['nis', 'nisn', 'nama', 'kelas', 'gender', 'telepon'],
    ['111001', '0051234567', 'Syamsu Maulida', 'X MIPA 1', 'Perempuan', '081234567890'],
    ['111002', '0051234568', 'Nama Siswa Kedua', 'X MIPA 2', 'Laki-laki', '081298765432'],
  ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Siswa')
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'templat-import-siswa.xlsx'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}