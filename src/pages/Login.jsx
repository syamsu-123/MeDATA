import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Eye, EyeOff, HeartPulse, ShieldCheck } from 'lucide-react'
import DnaNetworkAnimation from '../components/DnaNetworkAnimation'
import DnaFloatingParticles from '../components/DnaFloatingParticles'

const getLoginError = (error) => {
  if (error?.code === 'auth/api-key-not-valid') return 'Konfigurasi Firebase Auth tidak valid. Perbarui API key Firebase pada file .env.'
  if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') return 'Email atau password tidak benar.'
  if (error?.code === 'auth/too-many-requests') return 'Terlalu banyak percobaan. Coba lagi beberapa saat.'
  return 'Login gagal. Periksa koneksi dan konfigurasi Firebase.'
}

export default function Login() { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const navigate = useNavigate(); const { showToast } = useToast(); const { login } = useAuth()
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await login(email, password); showToast('Berhasil masuk'); navigate('/dashboard') } catch (error) { showToast(getLoginError(error), 'error') } finally { setBusy(false) } }
  return <main className="auth-page"><div className="auth-visual"><DnaFloatingParticles /><DnaNetworkAnimation /><div className="auth-logo"><HeartPulse size={24} /> MeData</div><div className="auth-visual-copy"><span className="eyebrow">Sistem sekolah terintegrasi</span><h2>Pendataan &<br /><em>Monitoring Siswa.</em></h2><p>Catat aktivitas pelayanan UKS dan kamar secara cepat, rapi, dan aman.</p></div><div className="auth-visual-footer"><ShieldCheck size={17} /> Data tersimpan aman dan terkontrol</div></div><form className="auth-card" onSubmit={submit}><div className="auth-card-head"><span className="auth-mobile-mark"><HeartPulse size={20} /></span><span className="eyebrow">Selamat datang kembali</span><h1>Masuk ke MeData</h1><p>Gunakan akun petugas untuk melanjutkan.</p></div><label>Email<input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@sekolah.sch.id" /></label><label>Password<span className="password-field"><input className="input-field" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Masukkan password" /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label><button className="btn-primary" disabled={busy}>{busy ? 'Memproses...' : 'Masuk ke Dashboard'}</button><p className="auth-help">Akses khusus untuk petugas sekolah.</p></form></main> }
