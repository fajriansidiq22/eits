'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, AlertCircle, Loader2, X } from 'lucide-react'
import { MODELS_TO_TRY } from '@/lib/gemini-constants'

type Section = 'READING' | 'GRAMMAR'

export default function GeneratePackagePage() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('READING')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [aiModel, setAiModel] = useState('auto')

  async function executeGenerate() {
    setShowModal(false)
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, model: aiModel }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error ?? 'Gagal men-generate paket soal.')
        setLoading(false)
        return
      }

      router.push('/admin/bank')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan koneksi.')
      setLoading(false)
    }
  }

  function handleOpenModal(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setShowModal(true)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <Link href="/admin/bank" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          Kembali
        </Link>
        <h1>Generate Paket AI</h1>
        <p>Gunakan AI untuk membuat 1 paket soal baru (berisi 30 soal) berdasarkan contoh Soal Asli.</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        <form onSubmit={handleOpenModal} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          <div className="form-group">
            <label className="form-label">Pilih Section</label>
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <button
                type="button"
                onClick={() => setSection('READING')}
                style={{
                  flex: 1, padding: '14px 20px', fontSize: '0.9375rem', fontWeight: 700,
                  border: `2px solid ${section === 'READING' ? 'var(--primary)' : 'var(--border)'}`,
                  background: section === 'READING' ? 'var(--primary-light)' : 'var(--surface)',
                  color: section === 'READING' ? 'var(--primary-dark)' : 'var(--text-primary)',
                  borderRadius: 'var(--r-lg)', cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                Reading
              </button>
              <button
                type="button"
                onClick={() => setSection('GRAMMAR')}
                style={{
                  flex: 1, padding: '14px 20px', fontSize: '0.9375rem', fontWeight: 700,
                  border: `2px solid ${section === 'GRAMMAR' ? 'var(--primary)' : 'var(--border)'}`,
                  background: section === 'GRAMMAR' ? 'var(--primary-light)' : 'var(--surface)',
                  color: section === 'GRAMMAR' ? 'var(--primary-dark)' : 'var(--text-primary)',
                  borderRadius: 'var(--r-lg)', cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                Grammar
              </button>
            </div>
            <p className="form-hint" style={{ marginTop: '8px' }}>
              Nama paket (A, B, C...) akan ditentukan secara otomatis berdasarkan jumlah paket yang sudah ada.
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spin" style={{ animation: 'spin 0.7s linear infinite' }} />
                AI sedang men-generate 30 soal... (~30 detik)
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate 30 Soal Baru
              </>
            )}
          </button>
        </form>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Pilih Model AI</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Pilih model AI yang akan digunakan untuk menghasilkan 30 soal baru.
            </p>
            <div className="form-group">
              <select 
                className="form-input" 
                value={aiModel} 
                onChange={(e) => setAiModel(e.target.value)}
                style={{ padding: '10px' }}
              >
                <option value="auto">Otomatis (Cari yang belum limit)</option>
                {MODELS_TO_TRY.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={executeGenerate}>
                Konfirmasi & Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
