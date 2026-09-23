import { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Profile() { const { user } = useAuth(); const { showToast } = useToast(); const [name, setName] = useState(user?.displayName || ''); const [busy, setBusy] = useState(false)
	const save = async (event) => { event.preventDefault(); setBusy(true); try { await updateProfile(user, { displayName: name }); showToast('Profil diperbarui') } catch (error) { showToast(error.message || 'Gagal memperbarui profil', 'error') } finally { setBusy(false) } }
	return <section className="page"><div className="page-heading"><div><span className="eyebrow">Akun</span><h2>Profil</h2></div></div><form className="panel profile-panel" onSubmit={save}><div className="avatar">{(name || user?.email || 'P').charAt(0).toUpperCase()}</div><div className="profile-form"><label>Nama tampilan<input className="input-field" value={name} onChange={(e) => setName(e.target.value)} /></label><p className="muted">{user?.email || '-'}<br />UID: {user?.uid || '-'}</p><button className="btn-primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan profil'}</button></div></form></section> }
