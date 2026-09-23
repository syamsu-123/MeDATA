import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PatientTable from '../../PatientTable'
import PatientForm from '../../PatientForm'
import Modal from '../../Modal'
import ConfirmModal from '../../ConfirmModal'
import { createPatient, deletePatient, getPatientsByLocation, updatePatient } from '../../patientService'
import { useLocationContext } from '../context/LocationContext'
import { useToast } from '../context/ToastContext'

export default function Patients() { const { currentLocation } = useLocationContext(); const { showToast } = useToast(); const [patients, setPatients] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editing, setEditing] = useState(null); const [removing, setRemoving] = useState(null)
  useEffect(() => { setLoading(true); return getPatientsByLocation(currentLocation, (items) => { setPatients(items); setLoading(false) }, (err) => { setError(err.message); setLoading(false) }) }, [currentLocation])
  const save = async (data) => { try { if (editing?.id) await updatePatient(editing.id, data); else await createPatient(data); showToast(editing ? 'Data pasien diperbarui' : 'Pasien berhasil ditambahkan'); setEditing(null) } catch (err) { showToast(err.message || 'Operasi gagal', 'error') } }
  const remove = async () => { try { await deletePatient(removing.id); showToast('Pasien dihapus'); setRemoving(null) } catch (err) { showToast(err.message || 'Gagal menghapus pasien', 'error') } }
  return <section className="page"><div className="page-heading"><div><span className="eyebrow">Data kesehatan</span><h2>Pasien</h2><p>Daftar pasien di {currentLocation}.</p></div><button className="btn-primary" onClick={() => setEditing({})}><Plus size={18} />Tambah pasien</button></div><PatientTable patients={patients} loading={loading} error={error} onEdit={setEditing} onDelete={setRemoving} /><div className="patient-links">{patients.map((patient) => <Link key={patient.id} to={`/patients/${patient.id}`}>Lihat {patient.name}</Link>)}</div><Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Edit pasien' : 'Tambah pasien'}><PatientForm patient={editing?.id ? editing : null} onSubmit={save} onCancel={() => setEditing(null)} /></Modal><ConfirmModal isOpen={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} title="Hapus pasien" message={`Hapus data ${removing?.name || ''}?`} /></section> }
