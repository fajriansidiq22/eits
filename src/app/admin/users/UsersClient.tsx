'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UserCheck, UserX, Eye, EyeOff, Copy, Check } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: Date
  _count: { sessions: number }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function UsersClient({ users: initialUsers }: { users: User[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(generatePassword())
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Gagal membuat user.')
      setLoading(false)
      return
    }
    setShowModal(false)
    setName('')
    setEmail('')
    setPassword(generatePassword())
    setLoading(false)
    router.refresh()
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    router.refresh()
  }

  function copyPassword() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--sp-6)' }}>
        <button className="btn btn-primary" onClick={() => {
          setShowModal(true)
          setPassword(generatePassword())
          setError('')
        }}>
          <Plus size={18} />
          Buat User Baru
        </button>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">Belum ada user</div>
            <p className="text-sm text-muted">Buat akun user untuk mulai menggunakan platform</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Sesi</th>
                <th>Bergabung</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td className="text-muted">{user.email}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{user._count.sessions}</span>
                    <span className="text-muted text-sm"> sesi</span>
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                      {user.isActive ? '● Aktif' : '● Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-primary'}`}
                      title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Buat User Baru</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Rina Dewi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="rina@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password Awal</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: '88px' }}
                    required
                  />
                  <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={copyPassword} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                      {copied ? <Check size={14} color="var(--primary)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <p className="form-hint">Bagikan password ini ke user. User dapat mengganti password setelah login.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Membuat...</> : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
