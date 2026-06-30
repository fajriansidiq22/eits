'use client'

import { useState, useEffect } from 'react'
import { Save, Lock, Loader2 } from 'lucide-react'

export default function AdminProfilePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [messageProfile, setMessageProfile] = useState({ text: '', type: '' })

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [messagePassword, setMessagePassword] = useState({ text: '', type: '' })

  useEffect(() => {
    // Fetch current user details
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setName(data.user.name)
          setEmail(data.user.email)
        }
      })
      .catch(err => console.error('Error fetching user', err))
  }, [])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoadingProfile(true)
    setMessageProfile({ text: '', type: '' })

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal memperbarui profil')
      
      setMessageProfile({ text: 'Profil berhasil diperbarui.', type: 'success' })
    } catch (err: any) {
      setMessageProfile({ text: err.message, type: 'error' })
    } finally {
      setLoadingProfile(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setMessagePassword({ text: 'Konfirmasi password tidak cocok', type: 'error' })
      return
    }

    setLoadingPassword(true)
    setMessagePassword({ text: '', type: '' })

    try {
      const res = await fetch('/api/admin/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal memperbarui password')
      
      setMessagePassword({ text: 'Password berhasil diperbarui.', type: 'success' })
      setPassword('')
      setPasswordConfirm('')
    } catch (err: any) {
      setMessagePassword({ text: err.message, type: 'error' })
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Pengaturan Profil Admin</h1>
        <p>Kelola data diri dan keamanan akun Anda.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--sp-6)', alignItems: 'start' }}>
        
        {/* Form Profil */}
        <form className="card" onSubmit={handleUpdateProfile}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>👤</span> Data Profil
          </h2>
          
          <div className="form-group">
            <label className="form-label">Alamat Email (Tidak bisa diubah)</label>
            <input type="email" className="form-input" value={email} disabled style={{ background: 'var(--surface-2)', cursor: 'not-allowed' }} />
            <p className="text-sm text-muted" style={{ marginTop: '4px' }}>Email admin hanya bisa diubah melalui konfigurasi Supabase.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
            />
          </div>

          {messageProfile.text && (
            <div className={`alert alert-${messageProfile.type}`} style={{ marginBottom: 'var(--sp-4)' }}>
              {messageProfile.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loadingProfile || !name}>
            {loadingProfile ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            Simpan Profil
          </button>
        </form>

        {/* Form Keamanan */}
        <form className="card" onSubmit={handleUpdatePassword}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} color="var(--primary-dark)" /> Keamanan Akun
          </h2>

          <div className="form-group">
            <label className="form-label">Password Baru</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru</label>
            <input 
              type="password" 
              className="form-input" 
              value={passwordConfirm} 
              onChange={e => setPasswordConfirm(e.target.value)} 
              minLength={6}
              required
            />
          </div>

          {messagePassword.text && (
            <div className={`alert alert-${messagePassword.type}`} style={{ marginBottom: 'var(--sp-4)' }}>
              {messagePassword.text}
            </div>
          )}

          <button type="submit" className="btn btn-secondary" disabled={loadingPassword || !password || !passwordConfirm}>
            {loadingPassword ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            Ubah Password
          </button>
        </form>
      </div>
    </div>
  )
}
