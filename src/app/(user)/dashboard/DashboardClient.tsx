'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, PenTool, ListChecks, Play, Loader2, Shuffle, Package, CheckCircle } from 'lucide-react'

type Section = 'READING' | 'GRAMMAR' | 'SIMULATION'
type Mode = 'PACKAGE' | 'RANDOM' | 'CHOOSE'

interface PackageItem {
  id: string
  name: string
  section: string
  questionCount: number
  createdAt: string
  isDone: boolean
}

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
    color: '#8B5CF6',
    bg: '#F3E8FF',
    available: true,
  },
]

const MODES = [
  {
    id: 'PACKAGE' as Mode,
    label: 'Paket Otomatis',
    desc: 'Sistem memilihkan paket yang belum pernah kamu kerjakan.',
    icon: Package,
  },
  {
    id: 'CHOOSE' as Mode,
    label: 'Pilih Paket Sendiri',
    desc: 'Lihat dan pilih sendiri paket soal yang ingin dikerjakan.',
    icon: CheckCircle,
  },
  {
    id: 'RANDOM' as Mode,
    label: 'Soal Random',
    desc: 'Sistem mengacak soal dari berbagai paket di Bank Soal.',
    icon: Shuffle,
  },
]

export default function DashboardClient() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('READING')
  const [mode, setMode] = useState<Mode>('PACKAGE')
  const [count, setCount] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // State untuk mode CHOOSE
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loadingPkg, setLoadingPkg] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  // Fetch packages saat mode CHOOSE dan section berubah
  useEffect(() => {
    if (mode !== 'CHOOSE' || section === 'SIMULATION') return
    setLoadingPkg(true)
    setSelectedPackageId(null)
    fetch(`/api/user/packages?section=${section}`)
      .then(r => r.json())
      .then(data => {
        setPackages(Array.isArray(data) ? data : [])
        setLoadingPkg(false)
      })
      .catch(() => setLoadingPkg(false))
  }, [mode, section])

  async function handleStart() {
    setError('')
    setLoading(true)
    try {
      const payload: Record<string, unknown> = { section, mode }
      if (mode === 'RANDOM') payload.count = count
      if (mode === 'CHOOSE') {
        if (!selectedPackageId) {
          setError('Pilih salah satu paket terlebih dahulu.')
          setLoading(false)
          return
        }
        payload.packageId = selectedPackageId
      }

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
                       setSelectedPackageId(null)
                       if (s.id === 'SIMULATION' && mode === 'RANDOM' && count < 30) {
                         setCount(30)
                       } else if (s.id !== 'SIMULATION' && mode === 'RANDOM' && count >= 30) {
                         setCount(10)
                       }
                       // Mode CHOOSE tidak tersedia untuk SIMULATION
                       if (s.id === 'SIMULATION' && mode === 'CHOOSE') {
                         setMode('PACKAGE')
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
                     width: 48, height: 48, borderRadius: 'var(--r-md)',
                     background: isSelected ? s.color : 'var(--surface-2)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     flexShrink: 0, transition: 'all 0.15s ease',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--sp-3)' }}>
            {MODES.filter(m => !(section === 'SIMULATION' && m.id === 'CHOOSE')).map(m => {
              const MIcon = m.icon
              const isSelected = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setSelectedPackageId(null) }}
                  style={{
                    padding: '16px 20px',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-lg)',
                    background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 0 var(--primary)' : '0 2px 0 var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <MIcon size={18} color={isSelected ? 'var(--primary-dark)' : 'var(--text-muted)'} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
                      {m.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {m.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 3a: Jumlah Soal (Hanya jika Random) */}
        {mode === 'RANDOM' && (
          <div style={{ marginBottom: 'var(--sp-8)', animation: 'fadeIn 0.3s ease' }}>
            <div className="section-title">3. Jumlah Soal</div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              {randomCounts.map(c => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  style={{
                    flex: 1, padding: '14px',
                    border: `2px solid ${count === c ? 'var(--secondary)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-lg)',
                    background: count === c ? 'var(--secondary-light)' : 'var(--surface)',
                    fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
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

        {/* Step 3b: Pilih Paket (mode CHOOSE) */}
        {mode === 'CHOOSE' && (
          <div style={{ marginBottom: 'var(--sp-8)', animation: 'fadeIn 0.3s ease' }}>
            <div className="section-title">3. Pilih Paket Soal</div>
            {loadingPkg ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite' }} />
              </div>
            ) : packages.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                Belum ada paket {section} yang tersedia.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
                {packages.map(pkg => {
                  const isSelected = selectedPackageId === pkg.id
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--sp-4)',
                        padding: '16px 20px',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--r-lg)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                        boxShadow: isSelected ? '0 2px 0 var(--primary)' : '0 2px 0 var(--border)',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: isSelected ? 'var(--primary)' : 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}>
                        <Package size={18} color={isSelected ? '#fff' : 'var(--text-muted)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: isSelected ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {pkg.questionCount} soal &middot; {new Date(pkg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      {pkg.isDone && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 10px', borderRadius: 999, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          ✓ Sudah Dikerjakan
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--sp-6)' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Start Card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-subtle), var(--secondary-light))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Siap Memulai! ✨</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                {SECTIONS.find(s => s.id === section)?.label} · {
                  mode === 'PACKAGE' ? 'Paket Otomatis' :
                  mode === 'RANDOM' ? `Random (${count} soal)` :
                  selectedPackageId
                    ? `Paket: ${packages.find(p => p.id === selectedPackageId)?.name ?? '...'}`
                    : 'Pilih paket terlebih dahulu'
                }
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStart}
              disabled={loading}
              style={{ minWidth: '180px', fontSize: '1rem' }}
            >
              {loading ? (
                <><Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite' }} /> Memulai Sesi...</>
              ) : (
                <><Play size={20} /> Mulai Kerjakan</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
