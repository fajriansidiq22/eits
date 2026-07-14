'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, PenTool, ListChecks, Search, ChevronRight,
  Loader2, Package, Eye
} from 'lucide-react'

type Section = 'READING' | 'GRAMMAR' | 'LISTENING' | 'SIMULATION'

interface PackageItem {
  id: string
  name: string
  section: Section
  questionCount: number
  createdAt: string
}

const SECTION_META: Record<Section, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  READING:    { label: 'Reading',    icon: BookOpen,    color: 'var(--secondary)',  bg: 'var(--secondary-light)' },
  GRAMMAR:    { label: 'Grammar',    icon: PenTool,     color: 'var(--primary)',    bg: 'var(--primary-light)'   },
  LISTENING:  { label: 'Listening',  icon: Eye,         color: '#8B5CF6',           bg: '#F3E8FF'                },
  SIMULATION: { label: 'Simulasi',   icon: ListChecks,  color: '#F59E0B',           bg: '#FEF3C7'                },
}

const ALL_SECTIONS: Section[] = ['READING', 'GRAMMAR', 'LISTENING', 'SIMULATION']

export default function ReviewListClient() {
  const router = useRouter()
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<Section | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/user/review')
      .then(r => r.json())
      .then(data => {
        setPackages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = packages.filter(pkg => {
    const matchSection = activeSection === 'ALL' || pkg.section === activeSection
    const matchSearch = pkg.name.toLowerCase().includes(search.toLowerCase())
    return matchSection && matchSearch
  })

  // Group by section for display
  const grouped = ALL_SECTIONS.reduce<Record<Section, PackageItem[]>>((acc, s) => {
    acc[s] = filtered.filter(p => p.section === s)
    return acc
  }, {} as Record<Section, PackageItem[]>)

  const totalBySection = ALL_SECTIONS.reduce<Record<Section, number>>((acc, s) => {
    acc[s] = packages.filter(p => p.section === s).length
    return acc
  }, {} as Record<Section, number>)

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <h1>📚 Review Soal</h1>
        <p>Pelajari semua soal beserta jawaban dan pembahasan. Gunakan fitur terjemahan untuk memahami teks Bahasa Inggris.</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
        {ALL_SECTIONS.map(s => {
          const meta = SECTION_META[s]
          const Icon = meta.icon
          const count = totalBySection[s]
          if (count === 0) return null
          return (
            <button
              key={s}
              onClick={() => setActiveSection(activeSection === s ? 'ALL' : s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                padding: '14px 16px',
                border: `2px solid ${activeSection === s ? meta.color : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)',
                background: activeSection === s ? meta.bg : 'var(--surface)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: activeSection === s ? `0 2px 0 ${meta.color}` : '0 2px 0 var(--border)',
              }}
            >
              <Icon size={20} color={activeSection === s ? meta.color : 'var(--text-muted)'} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: activeSection === s ? meta.color : 'var(--text-primary)' }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{count} paket</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--sp-6)' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Cari nama paket soal..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px 10px 42px',
            border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
            background: 'var(--surface)', color: 'var(--text-primary)',
            fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 0.7s linear infinite', marginBottom: 12 }} />
          <div>Memuat paket soal...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Tidak ada paket ditemukan</div>
          <p className="text-muted text-sm">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
          {ALL_SECTIONS.map(s => {
            const sectionPkgs = grouped[s]
            if (sectionPkgs.length === 0) return null
            const meta = SECTION_META[s]
            const Icon = meta.icon
            return (
              <div key={s}>
                {/* Section heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-4)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--r-md)',
                    background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={meta.color} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: meta.color }}>
                    {meta.label}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 999, fontWeight: 600 }}>
                    {sectionPkgs.length} paket
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
                  {sectionPkgs.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => router.push(`/review/${pkg.id}`)}
                      className="card card-hover"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
                        padding: '18px 20px', cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        textAlign: 'left', transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0,
                        background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Package size={20} color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {pkg.questionCount} soal &middot; {new Date(pkg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
