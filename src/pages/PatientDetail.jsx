import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { subscribePatient } from '../../patientService'
import { toDate } from '../utils/patientStats'

const fields = [['name', 'Nama'], ['patientId', 'ID Pasien'], ['birthDate', 'Tanggal lahir'], ['gender', 'Jenis kelamin'], ['phone', 'Telepon'], ['address', 'Alamat'], ['location', 'Lokasi'], ['status', 'Status']]
const dateText = (value) => toDate(value)?.toLocaleString('id-ID') || '-'
export default function PatientDetail() { const { id } = useParams(); const [patient, setPatient] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => subscribePatient(id, (data) => { setPatient(data); setLoading(false) }, (err) => { setError(err.message || 'Gagal memuat detail pasien'); setLoading(false) }), [id])
  if (loading) return <section className="page"><div className="panel">Memuat detail pasien...</div></section>
  if (error || !patient) return <section className="page"><div className="alert error">{error || 'Pasien tidak ditemukan'}</div><Link className="text-link" to="/patients">Kembali ke daftar pasien</Link></section>
  return <section className="page"><div className="page-heading"><div><span className="eyebrow">Rekam pasien</span><h2>{patient.name}</h2></div><Link className="btn-secondary" to="/patients">Kembali</Link></div><div className="detail-grid">{fields.map(([key, label]) => <div className="detail-item" key={key}><span>{label}</span><strong>{patient[key] || '-'}</strong></div>)}<div className="detail-item"><span>Tanggal dibuat</span><strong>{dateText(patient.createdAt)}</strong></div><div className="detail-item"><span>Terakhir diperbarui</span><strong>{dateText(patient.updatedAt)}</strong></div></div></section> }
