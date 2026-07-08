'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Merge, Loader2, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'

type Section = 'READING' | 'GRAMMAR'

interface Package {
  id: string
  name: string
  section: Section
  createdAt: string
  _count: { questions: number }
}

export default function MergePage() {
  const router = useRouter()
  const [filterSection, setFilterSection] = useState<Section>('READING')
  const [packages, setPackages] = useState<Package[]>([])
  const [loadingPkg, setLoadingPkg] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setLoadingPkg(true)
    setSelectedIds(new Set())
    fetch(`/api/admin/bank/packages?section=${filterSection}`)
      .then(r => r.json())
      .then(data => {
        setPackages(Array.isArray(data) ? data : [])
        setLoadingPkg(false)
      })
      .catch(() => setLoadingPkg(false))
  }, [filterSection])

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleMerge() {
    setError('')
    setSuccess('')
    if (!name.trim()) { setError('Nama paket gabungan wajib diisi.'); return }
    if (selectedIds.size < 2) { setError('Pilih minimal 2 paket untuk digabungkan.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/bank/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          section: filterSection,
          packageIds: Array.from(selectedIds),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Gagal menggabungkan paket.'); setSubmitting(false); return }
      setSuccess(data.message)
      setTimeout(() => router.push('/admin/bank'), 1800)
    } catch {
      setError('Terjadi kesalahan koneksi. Coba lagi.')
      setSubmitting(false)
    }
  }

  const totalSelectedQuestions = packages
    .filter(p => selectedIds.has(p.id))
    .reduce((sum, p) => sum + p._count.questions, 0)

  return (
    <div className="page-content">
      <div className="page-header">
        <Link href="/admin/bank" className="btn btn-secondary" style={{ marginBottom: 'var(--sp-4)', display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
        <h1>Gabungkan Paket Soal</h1>
        <p>Pilih dua atau lebih paket soal yang ingin digabungkan menjadi satu paket baru. Soal dari paket asal akan <strong>dipindahkan</strong> dan <strong>paket lama akan dihapus</strong> secara otomatis. Tidak ada duplikat.</p>
      </div>

      {/* Filter Section */}
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>1. Pilih Section</div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          {(['READING', 'GRAMMAR'] as Section[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterSection(s)}
              className={filterSection === s ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ minWidth: 120 }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Package List */}
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>
          2. Pilih Paket yang Ingin Digabung
          {selectedIds.size > 0 && (
            <span style={{ marginLeft: 12, fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', background: 'var(--primary-light)', padding: '2px 10px', borderRadius: 999 }}>
              {selectedIds.size} dipilih · {totalSelectedQuestions} soal
            </span>
          )}
        </div>

        {loadingPkg ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : packages.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Tidak ada paket {filterSection} yang tersedia.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
            {packages.map(pkg => {
              const selected = selectedIds.has(pkg.id)
              return (
                <button
                  key={pkg.id}
                  onClick={() => toggleSelect(pkg.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-4)',
                    padding: '16px 20px',
                    border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-lg)',
                    background: selected ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    boxShadow: selected ? '0 2px 0 var(--primary)' : '0 2px 0 var(--border)',
                  }}
                >
                  {selected
                    ? <CheckSquare size={22} color="var(--primary)" />
                    : <Square size={22} color="var(--text-muted)" />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: selected ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
                      {pkg.name}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {pkg._count.questions} soal &middot; {new Date(pkg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`badge ${pkg.section === 'READING' ? 'badge-blue' : 'badge-green'}`}>
                    {pkg.section}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Nama Paket Baru */}
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="section-title" style={{ marginBottom: 'var(--sp-3)' }}>3. Nama Paket Gabungan Baru</div>
        <input
          type="text"
          className="input"
          placeholder="cth: Gabungan Reading Paket 1 & 2"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ maxWidth: 480 }}
        />
      </div>

      {/* Feedback */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--sp-4)' }}>
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--sp-4)' }}>
          <span>✅</span> {success}
        </div>
      )}

      {/* Summary + Submit */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-subtle), var(--secondary-light))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              {selectedIds.size < 2
                ? 'Pilih minimal 2 paket untuk digabungkan'
                : `${selectedIds.size} paket dipilih · ${totalSelectedQuestions} soal total`}
            </div>
            {name && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                Nama baru: <strong>{name}</strong>
              </div>
            )}
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleMerge}
            disabled={submitting || selectedIds.size < 2 || !name.trim()}
            style={{ minWidth: 180 }}
          >
            {submitting ? (
              <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Menggabungkan...</>
            ) : (
              <><Merge size={18} /> Gabungkan Paket</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
