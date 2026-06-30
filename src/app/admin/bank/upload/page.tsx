'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UploadCloud, AlertCircle, Loader2 } from 'lucide-react'

export default function UploadBankPage() {
  const router = useRouter()
  const [section, setSection] = useState<'READING' | 'GRAMMAR'>('READING')
  const template = `[
  {
    "passage": "Only fill this if section is READING, otherwise leave empty or remove this key",
    "text": "Your question here...",
    "option_a": "Option A",
    "option_b": "Option B",
    "option_c": "Option C",
    "option_d": "Option D",
    "answer": "A",
    "explanation": "Explanation for the correct answer"
  }
]`

  const [jsonStr, setJsonStr] = useState(template)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      setError('Format JSON tidak valid.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/bank/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data: parsed }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error ?? 'Gagal upload data')
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

  return (
    <div className="page-content">
      <div className="page-header">
        <Link href="/admin/bank" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
        <h1>Upload Soal Asli</h1>
        <p>Soal asli yang diupload otomatis akan dibungkus menjadi sebuah Paket Soal.</p>
      </div>

      <div style={{ maxWidth: 800 }}>
        <form onSubmit={handleUpload} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
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
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="json-data">Data JSON (Array of Objects)</label>
            <textarea
              id="json-data"
              className="form-input"
              style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '0.875rem' }}
              value={jsonStr}
              onChange={e => setJsonStr(e.target.value)}
              placeholder={`[\n  {\n    "passage": "...",\n    "text": "...",\n    "option_a": "...",\n    "option_b": "...",\n    "option_c": "...",\n    "option_d": "...",\n    "answer": "A",\n    "explanation": "..."\n  }\n]`}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spin" />
                Menyimpan Data...
              </>
            ) : (
              <>
                <UploadCloud size={20} />
                Upload dan Buat Paket
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
