'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, PenTool, Headphones, ListChecks, Play, Loader2 } from 'lucide-react'

type Section = 'READING' | 'GRAMMAR' | 'SIMULATION'
type Mode = 'PACKAGE' | 'RANDOM'

const SECTIONS = [
  {
    id: 'READING' as Section,
    label: 'Latihan Reading',
    desc: 'Pemahaman bacaan, main idea, detail, inference',
    icon: BookOpen,
    color: 'var(--secondary)',
    bg: 'var(--secondary-light)',
    available: true,
  },
  {
    id: 'GRAMMAR' as Section,
    label: 'Latihan Grammar',
    desc: 'Tenses, prepositions, structure, error identification',
    icon: PenTool,
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
    available: true,
  },
  {
    id: 'SIMULATION' as Section,
    label: 'Simulasi Ujian (Mixed)',
    desc: 'Gabungan paket Reading dan Grammar sekaligus',
    icon: ListChecks,
    color: '#8B5CF6', // Purple
    bg: '#F3E8FF',
    available: true,
  },
]

export default function DashboardClient() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('READING')
  const [mode, setMode] = useState<Mode>('PACKAGE')
  const [count, setCount] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    setError('')
    setLoading(true)
    try {
      // payload sesuai schema
      const payload = { section, mode, count: mode === 'RANDOM' ? count : undefined }
      
      const res = await fetch('/api/user/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal memulai sesi. Coba lagi.')
        setLoading(false)
        return
      }
      router.push(`/practice/${data.sessionId}`)
    } catch {
      setError('Terjadi kesalahan koneksi. Coba lagi.')
      setLoading(false)
    }
  }

  // Pilihan jumlah soal random menyesuaikan section
  const randomCounts = section === 'SIMULATION' ? [30, 60] : [5, 10, 20]

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Mulai Latihan 🎯</h1>
        <p>Pilih mode latihan, sistem akan mencarikan soal yang sesuai dari Bank Soal.</p>
      </div>

      <div>
        {/* Step 1: Pilih Section */}
        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <div className="section-title">1. Pilih Mode Latihan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
            {SECTIONS.map(s => {
               const Icon = s.icon
               const isSelected = section === s.id
               return (
                 <button
                   key={s.id}
                   onClick={() => {
                     if (s.available) {
                       setSection(s.id)
                       if (s.id === 'SIMULATION' && mode === 'RANDOM' && count < 30) {
                         setCount(30)
                       } else if (s.id !== 'SIMULATION' && mode === 'RANDOM' && count >= 30) {
                         setCount(10)
                       }
                     }
                   }}
                   disabled={!s.available}
                   style={{
                     display: 'flex',
                     alignItems: 'flex-start',
                     gap: 'var(--sp-4)',
                     padding: '20px',
                     border: `2px solid ${isSelected ? s.color : 'var(--border)'}`,
                     borderRadius: 'var(--r-lg)',
                     background: isSelected ? s.bg : 'var(--surface)',
                     cursor: s.available ? 'pointer' : 'not-allowed',
                     transition: 'all 0.15s ease',
                     opacity: s.available ? 1 : 0.6,
                     textAlign: 'left',
                     boxShadow: isSelected ? `0 4px 0 ${s.color}` : '0 2px 0 var(--border)',
                     transform: isSelected ? 'translateY(-2px)' : 'none',
                   }}
                 >
                   <div style={{
                     width: 48,
                     height: 48,
                     borderRadius: 'var(--r-md)',
                     background: isSelected ? s.color : 'var(--surface-2)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     flexShrink: 0,
                     transition: 'all 0.15s ease',
                   }}>
                     <Icon size={24} color={isSelected ? '#fff' : s.color} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 800, fontSize: '1.05rem', color: isSelected ? s.color : 'var(--text-primary)', marginBottom: 4 }}>
                       {s.label}
                     </div>
                     <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                       {s.desc}
                     </div>
                   </div>
                 </button>
               )
            })}
          </div>
        </div>

        {/* Step 2: Pilih Metode */}
        <div style={{ marginBottom: 'var(--sp-8)' }}>
          <div className="section-title">2. Metode Pengambilan Soal</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
            <button
              onClick={() => setMode('PACKAGE')}
              style={{
                padding: '16px 20px',
                border: `2px solid ${mode === 'PACKAGE' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)',
                background: mode === 'PACKAGE' ? 'var(--primary-light)' : 'var(--surface)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: mode === 'PACKAGE' ? '0 2px 0 var(--primary)' : '0 2px 0 var(--border)',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', color: mode === 'PACKAGE' ? 'var(--primary-dark)' : 'var(--text-primary)', marginBottom: 4 }}>
                Satu Paket Penuh
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {section === 'SIMULATION' ? 'Sistem akan memilihkan 1 paket Reading & 1 paket Grammar (Total 60 soal) yang belum pernah dikerjakan.' : 'Sistem akan memilihkan 1 paket (30 soal) yang belum pernah kamu kerjakan sebelumnya.'}
              </div>
            </button>
            <button
              onClick={() => setMode('RANDOM')}
              style={{
                padding: '16px 20px',
                border: `2px solid ${mode === 'RANDOM' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)',
                background: mode === 'RANDOM' ? 'var(--primary-light)' : 'var(--surface)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: mode === 'RANDOM' ? '0 2px 0 var(--primary)' : '0 2px 0 var(--border)',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', color: mode === 'RANDOM' ? 'var(--primary-dark)' : 'var(--text-primary)', marginBottom: 4 }}>
                Soal Random
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Sistem mengacak soal dari berbagai paket di Bank Soal. Bebas tentukan jumlah soal.
              </div>
            </button>
          </div>
        </div>

        {/* Step 3: Jumlah Soal (Hanya jika Random) */}
        {mode === 'RANDOM' && (
          <div style={{ marginBottom: 'var(--sp-8)', animation: 'fadeIn 0.3s ease' }}>
            <div className="section-title">3. Jumlah Soal</div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              {randomCounts.map(c => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: `2px solid ${count === c ? 'var(--secondary)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-lg)',
                    background: count === c ? 'var(--secondary-light)' : 'var(--surface)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    color: count === c ? 'var(--secondary-dark)' : 'var(--text-primary)',
                    boxShadow: count === c ? '0 2px 0 var(--secondary)' : '0 2px 0 var(--border)',
                  }}
                >
                  {c} Soal
                </button>
              ))}
            </div>
            <p className="form-hint" style={{ marginTop: '8px' }}>
              Estimasi waktu: ~{Math.round(count * 2.5)} menit
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--sp-6)' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Generate */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-subtle), var(--secondary-light))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Siap Memulai! ✨</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                {SECTIONS.find(s => s.id === section)?.label} · {mode === 'PACKAGE' ? 'Satu Paket Penuh' : `Random (${count} soal)`}
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStart}
              disabled={loading}
              style={{ minWidth: '180px', fontSize: '1rem' }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spin" style={{ animation: 'spin 0.7s linear infinite' }} />
                  Memulai Sesi...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Mulai Kerjakan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
