'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, Package, ChevronDown, ChevronUp,
  SquareCheck, Square, Minus
} from 'lucide-react'
import { MODELS_TO_TRY } from '@/lib/gemini-constants'

interface PackageItem {
  id: string
  name: string
  section: string
  _count: { questions: number }
}

type Status = 'idle' | 'running' | 'done'

type PackageLog = {
  packageId: string
  name: string
  status: 'pending' | 'processing' | 'done' | 'error' | 'skip'
  count?: number
  error?: string
}

const SECTION_COLOR: Record<string, string> = {
  READING: 'var(--secondary)',
  GRAMMAR: 'var(--primary)',
  LISTENING: '#8B5CF6',
  SIMULATION: '#F59E0B',
}

export default function BulkExplanationPage() {
  const router = useRouter()

  // Package list
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loadingPkgs, setLoadingPkgs] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterSection, setFilterSection] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  // AI model
  const [aiModel, setAiModel] = useState('auto')

  // Processing
  const [status, setStatus] = useState<Status>('idle')
  const [logs, setLogs] = useState<PackageLog[]>([])
  const [totalUpdated, setTotalUpdated] = useState(0)
  const [showLogs, setShowLogs] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Fetch packages
  useEffect(() => {
    fetch('/api/admin/bank/packages')
      .then(r => r.json())
      .then(data => {
        setPackages(Array.isArray(data) ? data : [])
        setLoadingPkgs(false)
      })
      .catch(() => setLoadingPkgs(false))
  }, [])

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const sections = ['ALL', ...Array.from(new Set(packages.map(p => p.section)))]

  const filteredPkgs = packages.filter(p => {
    const matchSection = filterSection === 'ALL' || p.section === filterSection
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchSection && matchSearch
  })

  const filteredIds = new Set(filteredPkgs.map(p => p.id))
  const selectedInFiltered = filteredPkgs.filter(p => selected.has(p.id))
  const allFilteredSelected = filteredPkgs.length > 0 && filteredPkgs.every(p => selected.has(p.id))
  const someFilteredSelected = selectedInFiltered.length > 0 && !allFilteredSelected

  function togglePackage(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filteredPkgs.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filteredPkgs.forEach(p => next.add(p.id))
        return next
      })
    }
  }

  async function handleStart() {
    if (selected.size === 0) return
    if (!confirm(`Proses update pembahasan untuk ${selected.size} paket?\n\nProses ini mungkin membutuhkan beberapa menit.`)) return

    // init logs
    const pkgOrder = packages.filter(p => selected.has(p.id))
    setLogs(pkgOrder.map(p => ({ packageId: p.id, name: p.name, status: 'pending' })))
    setTotalUpdated(0)
    setStatus('running')
    setShowLogs(true)

    const ab = new AbortController()
    abortRef.current = ab

    try {
      const res = await fetch('/api/admin/bank/bulk-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageIds: pkgOrder.map(p => p.id), model: aiModel }),
        signal: ab.signal,
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Gagal memulai proses')
        setStatus('idle')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim()
          if (!line) continue
          try {
            const event = JSON.parse(line)
            handleEvent(event)
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        alert('Koneksi terputus. Proses mungkin masih berjalan di server.')
      }
    }

    setStatus('done')
  }

  function handleEvent(event: Record<string, unknown>) {
    const type = event.type as string

    if (type === 'package_start') {
      setLogs(prev => prev.map(l =>
        l.packageId === event.packageId ? { ...l, status: 'processing' } : l
      ))
    } else if (type === 'package_done') {
      setLogs(prev => prev.map(l =>
        l.packageId === event.packageId
          ? { ...l, status: 'done', count: event.count as number }
          : l
      ))
      setTotalUpdated(event.totalUpdated as number)
    } else if (type === 'package_error') {
      setLogs(prev => prev.map(l =>
        l.packageId === event.packageId
          ? { ...l, status: 'error', error: event.error as string }
          : l
      ))
    } else if (type === 'package_skip') {
      setLogs(prev => prev.map(l =>
        l.packageId === event.packageId ? { ...l, status: 'skip' } : l
      ))
    } else if (type === 'done') {
      setTotalUpdated(event.totalUpdated as number)
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    setStatus('idle')
  }

  const doneLogs = logs.filter(l => l.status === 'done').length
  const errorLogs = logs.filter(l => l.status === 'error').length
  const progress = logs.length > 0 ? Math.round(((doneLogs + errorLogs + logs.filter(l => l.status === 'skip').length) / logs.length) * 100) : 0

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push('/admin/bank')}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={16} /> Kembali ke Bank Soal
          </button>
          <h1>🔄 Bulk Update Pembahasan</h1>
          <p>Update pembahasan semua paket sekaligus dengan AI — tanpa perlu membuka satu per satu.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: status === 'idle' ? '1fr' : '1fr 380px', gap: 'var(--sp-6)', alignItems: 'flex-start' }}>
        {/* Left: Package Selection */}
        <div>
          {/* Model picker */}
          <div className="card" style={{ marginBottom: 'var(--sp-4)', padding: '20px 24px' }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>⚙️ Pengaturan AI</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Model AI
                </label>
                <select
                  className="form-input"
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value)}
                  disabled={status === 'running'}
                  style={{ padding: '8px 12px' }}
                >
                  <option value="auto">Otomatis (Cari yang belum limit)</option>
                  {MODELS_TO_TRY.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 280 }}>
                Mode "Otomatis" akan mencoba model terbaru dan fallback ke model lain jika terkena rate limit.
              </div>
            </div>
          </div>

          {/* Filter & Search */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Cari nama paket..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={status === 'running'}
              style={{
                flex: 1, minWidth: 180, padding: '8px 12px',
                border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '0.875rem',
              }}
            />
            {sections.filter(s => s !== 'ALL').map(s => (
              <button
                key={s}
                onClick={() => setFilterSection(filterSection === s ? 'ALL' : s)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--r-full)',
                  border: `1.5px solid ${filterSection === s ? (SECTION_COLOR[s] ?? 'var(--primary)') : 'var(--border)'}`,
                  background: filterSection === s ? `color-mix(in srgb, ${SECTION_COLOR[s] ?? 'var(--primary)'} 12%, transparent)` : 'var(--surface)',
                  color: filterSection === s ? (SECTION_COLOR[s] ?? 'var(--primary)') : 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Select all bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            marginBottom: 8,
          }}>
            <button
              onClick={toggleAll}
              disabled={status === 'running' || filteredPkgs.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}
            >
              {allFilteredSelected
                ? <SquareCheck size={18} color="var(--primary)" />
                : someFilteredSelected
                  ? <Minus size={18} color="var(--primary)" />
                  : <Square size={18} color="var(--text-muted)" />}
              {allFilteredSelected ? 'Batalkan Semua' : 'Pilih Semua'}
              {filteredPkgs.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({filteredPkgs.length} terlihat)</span>}
            </button>
            <span style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 700 }}>
              {selected.size} paket dipilih
            </span>
          </div>

          {/* Package list */}
          {loadingPkgs ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : filteredPkgs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Tidak ada paket ditemukan.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredPkgs.map(pkg => {
                const isChecked = selected.has(pkg.id)
                const color = SECTION_COLOR[pkg.section] ?? 'var(--primary)'
                const isProcessing = status === 'running'

                return (
                  <button
                    key={pkg.id}
                    onClick={() => !isProcessing && togglePackage(pkg.id)}
                    disabled={isProcessing}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      border: `1.5px solid ${isChecked ? color : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      background: isChecked ? `color-mix(in srgb, ${color} 8%, var(--surface))` : 'var(--surface)',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      textAlign: 'left', transition: 'all 0.12s',
                      opacity: isProcessing ? 0.75 : 1,
                    }}
                  >
                    {isChecked
                      ? <SquareCheck size={18} color={color} style={{ flexShrink: 0 }} />
                      : <Square size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isChecked ? color : 'var(--text-primary)' }}>
                        {pkg.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {pkg._count.questions} soal
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 999, background: `color-mix(in srgb, ${color} 15%, transparent)`, color,
                      flexShrink: 0,
                    }}>
                      {pkg.section}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {status === 'idle' && (
              <button
                className="btn btn-primary"
                onClick={handleStart}
                disabled={selected.size === 0}
                style={{ padding: '10px 24px', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Sparkles size={18} />
                Proses {selected.size > 0 ? `${selected.size} Paket` : 'Paket Terpilih'}
              </button>
            )}
            {status === 'running' && (
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <XCircle size={16} />
                Batalkan
              </button>
            )}
            {status === 'done' && (
              <button
                className="btn btn-secondary"
                onClick={() => { setStatus('idle'); setLogs([]) }}
                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <RefreshCw size={16} />
                Proses Ulang
              </button>
            )}
          </div>
        </div>

        {/* Right: Progress panel */}
        {status !== 'idle' && (
          <div style={{ position: 'sticky', top: 24 }}>
            <div className="card" style={{ padding: '20px 24px' }}>
              {/* Progress header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {status === 'running' && <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--primary)' }} />}
                  {status === 'done' && <CheckCircle2 size={16} color="var(--success)" />}
                  {status === 'running' ? 'Sedang Diproses...' : 'Selesai!'}
                </div>
                <button
                  onClick={() => setShowLogs(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: status === 'done' && errorLogs === 0 ? 'var(--success)' : 'var(--primary)',
                  borderRadius: 99, transition: 'width 0.4s ease',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 16 }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {doneLogs + errorLogs + logs.filter(l => l.status === 'skip').length} / {logs.length} paket
                </span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {totalUpdated} soal diperbarui
                </span>
              </div>

              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: showLogs ? 16 : 0 }}>
                {[
                  { label: 'Selesai', count: doneLogs, color: 'var(--success)' },
                  { label: 'Error', count: errorLogs, color: 'var(--error)' },
                  { label: 'Skip', count: logs.filter(l => l.status === 'skip').length, color: 'var(--text-muted)' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: stat.color }}>{stat.count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Log list */}
              {showLogs && (
                <div style={{
                  maxHeight: 400, overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  background: 'var(--surface-2)',
                }}>
                  {logs.map((log, i) => (
                    <div key={log.packageId} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '9px 12px',
                      borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        {log.status === 'pending' && <Square size={14} color="var(--text-muted)" />}
                        {log.status === 'processing' && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--primary)' }} />}
                        {log.status === 'done' && <CheckCircle2 size={14} color="var(--success)" />}
                        {log.status === 'error' && <XCircle size={14} color="var(--error)" />}
                        {log.status === 'skip' && <AlertCircle size={14} color="var(--text-muted)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600, fontSize: '0.8rem',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: log.status === 'error' ? 'var(--error)' : log.status === 'done' ? 'var(--success)' : 'var(--text-primary)',
                        }}>
                          {log.name}
                        </div>
                        {log.status === 'done' && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                            ✓ {log.count} soal diperbarui
                          </div>
                        )}
                        {log.status === 'error' && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: 1 }}>
                            {log.error}
                          </div>
                        )}
                        {log.status === 'skip' && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                            Dilewati (tidak ada soal)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}

              {status === 'done' && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: errorLogs === 0 ? 'var(--success-bg)' : 'var(--surface-2)',
                  borderRadius: 'var(--r-md)',
                  fontSize: '0.875rem', fontWeight: 600,
                  color: errorLogs === 0 ? 'var(--success)' : 'var(--text-secondary)',
                }}>
                  {errorLogs === 0
                    ? `✅ Semua ${logs.length} paket berhasil diproses!`
                    : `⚠️ Selesai dengan ${errorLogs} error.`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
