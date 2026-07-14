'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Glasses, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, X, BookOpen, Languages
} from 'lucide-react'

type Question = {
  id: string
  passage: string | null
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string
}

type Package = {
  id: string
  name: string
  section: string
  questions: Question[]
}

const SECTION_COLOR: Record<string, string> = {
  READING: 'var(--secondary)',
  GRAMMAR: 'var(--primary)',
  LISTENING: '#8B5CF6',
  SIMULATION: '#F59E0B',
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export default function ReviewDetailClient() {
  const params = useParams<{ packageId: string }>()
  const router = useRouter()

  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Translate mode
  const [translateMode, setTranslateMode] = useState(false)
  const [popup, setPopup] = useState<{
    top: number; left: number; text: string; translation: string; loading: boolean
  } | null>(null)

  // Expanded explanations state
  const [expandedExpl, setExpandedExpl] = useState<Set<string>>(new Set())

  // Fetch package detail
  useEffect(() => {
    fetch(`/api/user/review/${params.packageId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setPkg(data)
        setLoading(false)
      })
      .catch(() => { setError('Gagal memuat data paket.'); setLoading(false) })
  }, [params.packageId])

  // Translate mode: text selection → popup
  useEffect(() => {
    if (!translateMode) {
      setPopup(null)
      return
    }

    let timeoutId: NodeJS.Timeout
    let lastText = ''

    const handleSelectionChange = () => {
      clearTimeout(timeoutId)
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setPopup(null); lastText = ''; return
      }
      const text = selection.toString().trim()
      if (!text || text.length > 500) return

      timeoutId = setTimeout(async () => {
        if (text === lastText) return
        lastText = text
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setPopup({
          top: Math.min(rect.bottom + window.scrollY + 10, document.body.scrollHeight - 200),
          left: Math.min(Math.max(10, rect.left + window.scrollX), window.innerWidth - 340),
          text, translation: '', loading: true,
        })
        try {
          const res = await fetch('/api/user/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          })
          const data = await res.json()
          setPopup(prev =>
            prev && prev.text === text
              ? { ...prev, translation: data.success ? data.translated : '⚠️ ' + data.error, loading: false }
              : prev
          )
        } catch {
          setPopup(prev => prev && prev.text === text ? { ...prev, translation: 'Gagal terhubung.', loading: false } : prev)
        }
      }, 400)
    }

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const popupEl = document.getElementById('translate-popup')
      if (popupEl && popupEl.contains(e.target as Node)) return
      window.getSelection()?.removeAllRanges()
      setPopup(null); lastText = ''
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', handlePointerDown as EventListener)
    document.addEventListener('touchstart', handlePointerDown as EventListener)
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mousedown', handlePointerDown as EventListener)
      document.removeEventListener('touchstart', handlePointerDown as EventListener)
    }
  }, [translateMode])

  function toggleExpl(id: string) {
    setExpandedExpl(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function expandAll() {
    if (!pkg) return
    setExpandedExpl(new Set(pkg.questions.map(q => q.id)))
  }

  function collapseAll() {
    setExpandedExpl(new Set())
  }

  if (loading) return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: 80 }}>
      <Loader2 size={36} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--primary)' }} />
      <div style={{ marginTop: 16, color: 'var(--text-muted)' }}>Memuat soal...</div>
    </div>
  )

  if (error || !pkg) return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>😕</div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{error || 'Paket tidak ditemukan.'}</div>
      <button className="btn btn-secondary" onClick={() => router.back()}>
        <ArrowLeft size={16} /> Kembali
      </button>
    </div>
  )

  const sectionColor = SECTION_COLOR[pkg.section] ?? 'var(--primary)'
  const allExpanded = pkg.questions.every(q => expandedExpl.has(q.id))

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()} style={{ marginBottom: 12 }}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <BookOpen size={26} color={sectionColor} />
            {pkg.name}
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
            <span className="badge badge-blue" style={{ background: `color-mix(in srgb, ${sectionColor} 15%, transparent)`, color: sectionColor }}>
              {pkg.section}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{pkg.questions.length} soal</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Expand / Collapse all */}
          <button
            className="btn btn-secondary"
            onClick={allExpanded ? collapseAll : expandAll}
            style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
          >
            {allExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {allExpanded ? 'Tutup Semua' : 'Buka Semua'} Pembahasan
          </button>

          {/* Translate Toggle */}
          <button
            onClick={() => setTranslateMode(m => !m)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 'var(--r-lg)',
              border: `2px solid ${translateMode ? sectionColor : 'var(--border)'}`,
              background: translateMode ? `color-mix(in srgb, ${sectionColor} 12%, transparent)` : 'var(--surface)',
              color: translateMode ? sectionColor : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: translateMode ? `0 2px 0 ${sectionColor}` : '0 2px 0 var(--border)',
            }}
            title={translateMode ? 'Matikan mode terjemahan' : 'Aktifkan mode terjemahan (blok teks untuk menerjemahkan)'}
          >
            <Glasses size={18} />
            {translateMode ? '🟢 Terjemahan Aktif' : 'Mode Terjemahan'}
          </button>
        </div>
      </div>

      {/* Translate hint banner */}
      {translateMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: `color-mix(in srgb, ${sectionColor} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${sectionColor} 30%, transparent)`,
          borderRadius: 'var(--r-lg)', padding: '12px 16px', marginBottom: 'var(--sp-6)',
          fontSize: '0.875rem', color: sectionColor, fontWeight: 600,
          animation: 'fadeIn 0.2s ease',
        }}>
          <Languages size={18} />
          <span>Mode Terjemahan Aktif — Blok / pilih teks mana saja untuk mendapatkan terjemahan bahasa Indonesia.</span>
        </div>
      )}

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
        {pkg.questions.map((q, i) => {
          const hasPassage = !!q.passage
          const isExplOpen = expandedExpl.has(q.id)

          const optionList = (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              {OPTIONS.map(k => {
                const v = k === 'A' ? q.optionA : k === 'B' ? q.optionB : k === 'C' ? q.optionC : q.optionD
                const isCorrect = q.correctAnswer === k
                return (
                  <div
                    key={k}
                    style={{
                      padding: '10px 14px',
                      background: isCorrect ? 'var(--success-bg)' : 'var(--surface-2)',
                      border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)', fontSize: '0.875rem',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: isCorrect ? 'var(--success)' : 'var(--border)',
                      color: isCorrect ? '#fff' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.75rem',
                    }}>
                      {k}
                    </span>
                    <span style={{ flex: 1 }}>{v}</span>
                    {isCorrect && <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
          )

          const questionCard = (
            <div>
              {/* Number + question text */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: `color-mix(in srgb, ${sectionColor} 15%, transparent)`,
                  color: sectionColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.875rem',
                }}>
                  {i + 1}
                </div>
                <p style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.65, paddingTop: 4, margin: 0, userSelect: translateMode ? 'text' : 'auto' }}>
                  {q.text}
                </p>
              </div>

              {optionList}

              {/* Pembahasan toggle */}
              <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleExpl(q.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: isExplOpen ? 'var(--surface-2)' : 'var(--surface)',
                    border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                    fontWeight: 700, color: 'var(--text-secondary)', gap: 8,
                    transition: 'background 0.15s',
                  }}
                >
                  <span>💡 Lihat Pembahasan</span>
                  {isExplOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isExplOpen && (
                  <div style={{
                    padding: '12px 16px', background: 'var(--surface-2)',
                    fontSize: '0.875rem', lineHeight: 1.7,
                    color: 'var(--text-primary)', borderTop: '1px solid var(--border)',
                    animation: 'fadeIn 0.15s ease',
                    userSelect: translateMode ? 'text' : 'auto',
                  }}>
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          )

          return (
            <div key={q.id} className="card" style={{ padding: hasPassage ? 20 : undefined }}>
              {hasPassage ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-6)' }}>
                  {/* Passage */}
                  <div style={{ borderRight: '1px solid var(--border)', paddingRight: 'var(--sp-6)' }}>
                    <div style={{
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: sectionColor, marginBottom: 'var(--sp-3)',
                    }}>
                      📖 Passage
                    </div>
                    <p style={{
                      lineHeight: 1.85, fontSize: '0.9rem', margin: 0,
                      whiteSpace: 'pre-wrap', textAlign: 'justify',
                      userSelect: translateMode ? 'text' : 'auto',
                    }}>
                      {q.passage}
                    </p>
                  </div>
                  <div>{questionCard}</div>
                </div>
              ) : questionCard}
            </div>
          )
        })}
      </div>

      {/* Translate popup */}
      {popup && (
        <div
          id="translate-popup"
          style={{
            position: 'absolute',
            top: popup.top,
            left: popup.left,
            zIndex: 9999,
            width: 320,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            padding: '14px 16px',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <Languages size={14} />
              Terjemahan (ID)
            </div>
            <button
              onClick={() => setPopup(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
          {/* Original */}
          <div style={{
            fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8,
            padding: '6px 10px', background: 'var(--surface-2)',
            borderRadius: 'var(--r-sm)', fontStyle: 'italic', lineHeight: 1.5,
          }}>
            "{popup.text}"
          </div>
          {/* Translation */}
          {popup.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
              Menerjemahkan...
            </div>
          ) : (
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.55 }}>
              {popup.translation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
