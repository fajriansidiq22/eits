'use client'

import { useState } from 'react'
import { Sparkles, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MODELS_TO_TRY } from '@/lib/gemini-constants'

export default function UpdatePackageExplanationsBtn({ packageId, totalQuestions }: { packageId: string, totalQuestions: number }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [aiModel, setAiModel] = useState('auto')
  const router = useRouter()

  async function executeUpdateBulk() {
    setShowModal(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bank/package/${packageId}/explanation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: aiModel })
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal memperbarui pembahasan paket')
      } else {
        alert('Berhasil memperbarui semua pembahasan di paket ini!')
        router.refresh()
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
      disabled={loading || totalQuestions === 0}
      className="btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 'var(--r-md)',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: (loading || totalQuestions === 0) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: (loading || totalQuestions === 0) ? 0.7 : 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      title="Perbarui Semua Pembahasan dengan AI Sekaligus"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Memproses {totalQuestions} Soal...</span>
        </>
      ) : (
        <>
          <Sparkles size={16} />
          <span>Update Semua Pembahasan (AI)</span>
        </>
      )}
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', color: 'initial' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Pilih Model AI</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin memperbarui seluruh <b>{totalQuestions}</b> pembahasan di paket ini menggunakan AI?
            </p>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-primary)' }}>Model AI</label>
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
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ color: 'var(--text-primary)' }}>Batal</button>
              <button className="btn btn-primary" onClick={executeUpdateBulk}>
                Konfirmasi & Proses
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
