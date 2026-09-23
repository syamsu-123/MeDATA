import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
import { importStudents, removeStudent, saveStudent, subscribeStudents } from '../services/firestoreService'

export default function Students() {
  const { user, isViewer, canWrite } = useAuth()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const [students, setStudents] = useState([])
  const [term, setTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [item, setItem] = useState(null)
  const [values, setValues] = useState({ nis: '', nisn: '', name: '', class: '', gender: t('students.male'), phone: '', status: 'active' })
  const [error, setError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [parsedRows, setParsedRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [removing, setRemoving] = useState(null)
  const [page, setPage] = useState(0)
  const [importKey, setImportKey] = useState(0)
  const pageSize = 20
  const fileInput = useRef(null)

  const blank = useMemo(
    () => ({ nis: '', nisn: '', name: '', class: '', gender: t('students.male'), phone: '', status: 'active' }),
    [t],
  )
  const fields = useMemo(
    () => [
      ['nis', t('students.colNis')],
      ['nisn', 'NISN'],
      ['name', t('students.fullName')],
      ['class', t('students.colClass')],
      ['phone', t('students.phoneNumber')],
    ],
    [t],
  )

  useEffect(() => subscribeStudents(setStudents, setError), [])
  useEffect(() => setPage(0), [term, classFilter, genderFilter])

  const classOptions = useMemo(() => {
    const set = new Set(students.map((s) => (s.class || '').trim() || t('common.dash')))
    return [...set].sort((a, b) =>
      a === t('common.dash') ? 1 : b === t('common.dash') ? -1 : String(a).localeCompare(String(b), undefined, { numeric: true }),
    )
  }, [students, t])

  const genderOptions = useMemo(() => {
    const set = new Set(students.map((s) => (s.gender || '').trim()).filter(Boolean))
    return [...set]
  }, [students])

  const filtered = useMemo(() => {
    const q = term.toLowerCase()
    return students.filter((student) => {
      const haystack = `${student.name} ${student.nis} ${student.nisn} ${student.class}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      const cls = (student.class || '').trim() || t('common.dash')
      if (classFilter && cls !== classFilter) return false
      if (genderFilter && (student.gender || '').trim() !== genderFilter) return false
      return true
    })
  }, [students, term, classFilter, genderFilter, t])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1))
  }, [page, totalPages])
  const shown = useMemo(
    () => filtered.slice(page * pageSize, page * pageSize + pageSize),
    [filtered, page],
  )
  const classCounts = useMemo(() => {
    const counts = {}
    for (const student of students) {
      const cls = (student.class || '').trim() || t('common.dash')
      counts[cls] = (counts[cls] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  }, [students, t])
  const prevPage = () => setPage((p) => Math.max(0, p - 1))
  const nextPage = () => setPage((p) => Math.min(totalPages - 1, p + 1))
  const edit = (student) => {
    if (!canWrite) {
      showToast(t('students.viewerEditError'), 'error')
      return
    }
    setItem(student ?? {})
    setValues(student || blank)
    setError('')
  }
  const close = () => {
    setItem(null)
    setValues(blank)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!canWrite) {
      setError(t('students.viewerAddError'))
      return
    }
    if (!values.nis || !values.name || !values.class) {
      setError(t('students.requiredFields'))
      return
    }
    try {
      await saveStudent(item?.id, values, user.uid)
      showToast(item?.id ? t('students.saveSuccess') : t('students.addSuccess'))
      close()
    } catch (saveError) {
      showToast(saveError.message || t('students.saveFailed'), 'error')
    }
  }

  const remove = (student) => {
    if (!canWrite) {
      showToast(t('students.viewerDeleteError'), 'error')
      return
    }
    setRemoving(student)
  }

  const confirmRemove = async () => {
    if (!removing) return
    try {
      await removeStudent(removing.id)
      showToast(t('students.deleteSuccess'))
    } catch (removeError) {
      showToast(removeError.message || t('students.deleteFailed'), 'error')
    } finally {
      setRemoving(null)
    }
  }

  const existingNis = useMemo(
    () => new Set(students.map((student) => String(student.nis || '').trim().toLowerCase())),
    [students],
  )

  const openImport = () => {
    if (!canWrite) {
      showToast(t('students.viewerAddError'), 'error')
      return
    }
    setImportOpen(true)
    setImportFile(null)
    setParsedRows([])
    setImportError('')
    setImporting(false)
    setImportKey((k) => k + 1)
  }

  const closeImport = () => {
    if (importing) return
    setImportOpen(false)
    setImportFile(null)
    setParsedRows([])
    setImportError('')
    setImporting(false)
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setImportFile(null)
      setParsedRows([])
      setImportError(t('students.fileFormatError'))
      return
    }
    setImportFile(file)
    setParsedRows([])
    setImportError('')
    setImporting(true)
    try {
      const { parseStudentsFile } = await import('../utils/excelImport')
      const result = await parseStudentsFile(file)
      setParsedRows(result.rows)
      if (result.problems.length) setImportError(result.problems[0])
    } catch (parseError) {
      console.error(parseError)
      setImportFile(null)
      setParsedRows([])
      setImportError(t('students.fileReadError'))
    } finally {
      setImporting(false)
    }
  }

  const preview = useMemo(() => {
    const seen = new Set(existingNis)
    return parsedRows
      .filter((row) => row.ok)
      .map((row) => {
        const dup = seen.has(String(row.nis || '').trim().toLowerCase())
        seen.add(String(row.nis || '').trim().toLowerCase())
        return { ...row, dup }
      })
  }, [parsedRows, existingNis])

  const validRows = useMemo(() => preview.filter((row) => !row.dup), [preview])

  const handleDownloadTemplate = async () => {
    try {
      const { downloadStudentTemplate } = await import('../utils/excelImport')
      downloadStudentTemplate()
    } catch {
      showToast(t('students.templateFailed'), 'error')
    }
  }

  const runImport = async () => {
    if (!validRows.length || !canWrite) return
    setImporting(true)
    setImportError('')
    try {
      const count = await importStudents(
        validRows.map(({ nis, nisn, name, class: classValue, gender, phone }) => ({
          nis,
          nisn,
          name,
          class: classValue,
          gender,
          phone,
        })),
        user.uid,
      )
      showToast(`${count} ${t('students.importSuccessSuffix')}`)
      setImportOpen(false)
      setImportFile(null)
      setParsedRows([])
      setImportError('')
    } catch (importSaveError) {
      setImportError(importSaveError.message || t('students.importFailed'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('students.eyebrow')}</span>
          <h2>{t('students.title')}</h2>
          <p>{t('students.desc')}</p>
        </div>
        {canWrite && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={openImport}>
              <Upload size={17} /> {t('students.importExcel')}
            </button>
            <button className="btn-primary" onClick={() => edit(null)}>
              <Plus size={17} /> {t('students.addStudent')}
            </button>
          </div>
        )}
      </div>

      {isViewer && (
        <div className="alert warning" style={{ marginBottom: '16px' }}>
          <span dangerouslySetInnerHTML={{ __html: t('viewer.students') }} />
        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      <input
        className="filter-input"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={t('students.searchPlaceholder')}
      />
      <div className="filter-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
        <select className="filter-input" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">{t('students.filterAllClasses')}</option>
          {classOptions.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <select className="filter-input" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">{t('students.filterAllGenders')}</option>
          {genderOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        {(classFilter || genderFilter) && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setClassFilter(''); setGenderFilter('') }}
          >
            <X size={16} /> {t('students.filterReset')}
          </button>
        )}
        {(classFilter || genderFilter || term) && (
          <span className="muted" style={{ fontSize: '13px' }}>
            {filtered.length} {t('students.filterResult')}
          </span>
        )}
      </div>
      <div className="summary-bar">
        <div className="summary-item">
          <strong>{students.length}</strong>
          <span>{t('students.totalStudents')}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-items">
          {classCounts.map(([cls, count]) => (
            <button
              type="button"
              key={cls}
              className="summary-item"
              onClick={() => setClassFilter(classFilter === cls ? '' : cls)}
              title={cls}
              style={{
                cursor: 'pointer',
                font: 'inherit',
                textAlign: 'left',
                background: 'none',
                border: classFilter === cls ? '1px solid var(--md-primary, #14B8A6)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '4px 8px',
              }}
            >
              <strong>{count}</strong>
              <span>{cls}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('students.colNis')}</th>
              <th>{t('students.colName')}</th>
              <th>{t('students.colClass')}</th>
              <th>{t('students.colGender')}</th>
              <th>{t('students.colPhone')}</th>
              {canWrite && <th />}
            </tr>
          </thead>
          <tbody>
            {shown.map((student) => (
              <tr key={student.id}>
                <td>{student.nis}</td>
                <td>
                  <strong>{student.name}</strong>
                  <small>{student.nisn || t('common.dash')}</small>
                </td>
                <td>{student.class}</td>
                <td>{student.gender}</td>
                <td>{student.phone || t('common.dash')}</td>
                {canWrite && (
                  <td className="row-actions">
                    <button onClick={() => edit(student)} aria-label={t('students.editStudent')}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => remove(student)} aria-label={t('students.deleteStudent')}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={canWrite ? 6 : 5}>
                  <div className="empty-state">{t('students.emptyState')}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="pagination">
          <button
            type="button"
            className="pagination-btn"
            onClick={prevPage}
            disabled={page === 0}
          >
            <ChevronLeft size={16} /> {t('students.prev')}
          </button>
          <span className="pagination-info">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="pagination-btn"
            onClick={nextPage}
            disabled={page >= totalPages - 1}
          >
            {t('students.next')} <ChevronRight size={16} />
          </button>
        </div>
      )}

      {removing && canWrite && (
        <div className="modal-backdrop">
          <div className="dialog">
            <div className="dialog-head">
              <h3>{t('students.deleteStudent')}</h3>
              <button
                type="button"
                className="dialog-close"
                onClick={() => setRemoving(null)}
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>
            <p className="muted" style={{ margin: '0', lineHeight: '1.6' }}>
              {t('students.deleteConfirm')} <strong style={{ color: 'inherit' }}>{removing.name}</strong>{t('students.deleteWarning')}
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={() => setRemoving(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn-danger" onClick={confirmRemove}>
                <Trash2 size={16} /> {t('students.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {item !== null && canWrite && (
        <div className="modal-backdrop">
          <form className="dialog student-form" onSubmit={submit}>
            <h3>{item.id ? t('students.editStudent') : t('students.addNewStudent')}</h3>
            {fields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={values[key] || ''}
                  onChange={(event) => setValues({ ...values, [key]: event.target.value })}
                />
              </label>
            ))}
            <label>
              {t('students.colGender')}
              <select
                value={values.gender}
                onChange={(event) => setValues({ ...values, gender: event.target.value })}
              >
                <option>{t('students.male')}</option>
                <option>{t('students.female')}</option>
              </select>
            </label>
            <div className="dialog-actions">
              <button type="button" className="btn-secondary" onClick={close}>
                {t('common.cancel')}
              </button>
              <button className="btn-primary">{t('common.save')}</button>
            </div>
          </form>
        </div>
      )}

      {importOpen && canWrite && (
        <div className="modal-backdrop">
          <div className="dialog dialog-wide">
            <div className="dialog-head">
              <h3>{t('students.importTitle')}</h3>
              <button type="button" className="dialog-close" onClick={closeImport} aria-label={t('common.close')}>
                <X size={18} />
              </button>
            </div>
            <p className="muted" style={{ marginBottom: '14px' }}>
              {t('students.importTemplate')}{' '}
              <strong style={{ color: 'inherit' }}>{t('students.importTemplateCols')}</strong> {t('students.importTemplateNote')}
            </p>

            {importError && <div className="alert error">{importError}</div>}

            <div className="import-toolbar">
              <button type="button" className="btn-secondary" onClick={handleDownloadTemplate}>
                <Download size={16} /> {t('students.downloadTemplate')}
              </button>
              <label className="btn-primary import-file-label">
                <Upload size={16} /> {importing ? t('students.readingFile') : t('students.chooseFile')}
                <input
                  key={importKey}
                  ref={fileInput}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  hidden
                  onChange={handleFile}
                />
              </label>
            </div>

            {importFile && !importing && (
              <>
                <p className="import-summary">
                  <strong style={{ color: 'inherit' }}>{importFile.name}</strong>
                  <span className="badge badge-complete">{preview.length} {t('students.rows')}</span>
                  <span className="badge badge-active">{validRows.length} {t('students.readyToImport')}</span>
                  <span className="badge badge-warn">
                    {preview.length - validRows.length} {t('students.skippedDuplicates')}
                  </span>
                </p>
                {parsedRows.some((row) => !row.ok) && (
                  <p className="alert warning" style={{ margin: '0 0 12px', padding: '10px 12px' }}>
                    {parsedRows.filter((row) => !row.ok).length} {t('students.validationFailed')}
                  </p>
                )}
                <div className="table-wrap import-preview">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('students.colNis')}</th>
                        <th>{t('students.colName')}</th>
                        <th>{t('students.colClass')}</th>
                        <th>{t('students.colGender')}</th>
                        <th>{t('students.colPhone')}</th>
                        <th>{t('students.colNotes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 50).map((row, index) => (
                        <tr key={`${row.nis}-${index}`}>
                          <td>{row.nis || t('common.dash')}</td>
                          <td>
                            <strong>{row.name || t('common.dash')}</strong>
                          </td>
                          <td>{row.class || t('common.dash')}</td>
                          <td>{row.gender || t('common.dash')}</td>
                          <td>{row.phone || t('common.dash')}</td>
                          <td>
                            {row.dup ? (
                              <span className="badge badge-warn">{t('students.duplicateNis')}</span>
                            ) : (
                              <span className="badge badge-complete">{t('students.ok')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {preview.length > 50 && (
                        <tr>
                          <td colSpan="6">
                            <small>{t('students.moreRows')} {preview.length - 50} {t('students.moreRowsSuffix')}</small>
                          </td>
                        </tr>
                      )}
                      {!parsedRows.length && (
                        <tr>
                          <td colSpan="6">
                            <div className="empty-state">{t('students.noFileData')}</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="dialog-actions">
                  <button type="button" className="btn-secondary" onClick={closeImport}>
                    {t('common.cancel')}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={runImport}
                    disabled={!validRows.length}
                  >
                    {importing ? t('students.importing') : `${t('students.importCount')} ${validRows.length} ${t('students.importCountSuffix')}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
