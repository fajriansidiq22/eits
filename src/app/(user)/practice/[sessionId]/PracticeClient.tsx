'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, Check, Glasses, Loader2 } from 'lucide-react'

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
  order: number
}

type Session = {
  id: string
  section: string
  totalQ: number
  questions: Question[]
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const
type Option = typeof OPTIONS[number]

const sectionLabel: Record<string, string> = { READING: 'Reading', GRAMMAR: 'Grammar' }

export default function PracticeClient({ session }: { session: Session }) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Option>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState<{
    questionId: string
    selected: Option
    correct: boolean
    correctAnswer: Option
    explanation: string
  } | null>(null)
  
  const [translateMode, setTranslateMode] = useState(false)
  const [popup, setPopup] = useState<{ top: number, left: number, text: string, translation: string, loading: boolean } | null>(null)

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
        setPopup(null)
        lastText = ''
        return
      }

      const text = selection.toString().trim()
      if (text.length === 0 || text.length > 500) return

      // Debounce: wait until user stops dragging for 400ms
      timeoutId = setTimeout(async () => {
        if (text === lastText) return
        lastText = text

        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setPopup({
          top: Math.min(rect.bottom + 10, window.innerHeight - 150),
          left: Math.min(Math.max(10, rect.left), window.innerWidth - 320),
          text,
          translation: '',
          loading: true
        })

        try {
          const res = await fetch('/api/user/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          })
          const data = await res.json()
          if (data.success) {
            setPopup(prev => prev && prev.text === text ? { ...prev, translation: data.translated, loading: false } : prev)
          } else {
            setPopup(prev => prev && prev.text === text ? { ...prev, translation: 'Error: ' + data.error, loading: false } : prev)
          }
        } catch (err) {
          setPopup(prev => prev && prev.text === text ? { ...prev, translation: 'Gagal terhubung', loading: false } : prev)
        }
      }, 400)
    }

    const handlePointerDown = (e: Event) => {
      const popupEl = document.getElementById('translate-popup')
      if (popupEl && popupEl.contains(e.target as Node)) return
      
      const selection = window.getSelection()
      if (selection) selection.removeAllRanges()
      setPopup(null)
      lastText = ''
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [translateMode])

  const question = session.questions[current]
  const totalQ = session.questions.length
  const progress = Math.round(((current) / totalQ) * 100)
  const allAnswered = session.questions.every(q => answers[q.id])

  const optionTexts: Record<Option, string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  }

  function handleSelect(opt: Option) {
    if (answers[question.id]) return
    const isCorrect = opt === question.correctAnswer
    setAnswers(prev => ({ ...prev, [question.id]: opt }))
    setShowFeedback({
      questionId: question.id,
      selected: opt,
      correct: isCorrect,
      correctAnswer: question.correctAnswer as Option,
      explanation: question.explanation,
    })
  }

  function handleNext() {
    setShowFeedback(null)
    if (current < totalQ - 1) setCurrent(c => c + 1)
  }

  function handlePrev() {
    setShowFeedback(null)
    if (current > 0) setCurrent(c => c - 1)
  }

  async function handleSubmit() {
    if (!allAnswered) {
      const unanswered = session.questions.findIndex(q => !answers[q.id])
      if (unanswered !== -1) { setCurrent(unanswered); setShowFeedback(null); return }
    }
    setSubmitting(true)
    const answerList = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
    const res = await fetch(`/api/user/sessions/${session.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answerList }),
    })
    if (res.ok) router.push(`/practice/${session.id}/results`)
    else setSubmitting(false)
  }

  async function handleExit() {
    const confirm = window.confirm('Apakah Anda yakin ingin keluar?\n\nSesi latihan ini akan dibatalkan dan tidak akan disimpan di riwayat Anda.')
    if (confirm) {
      try {
        await fetch(`/api/user/sessions/${session.id}`, { method: 'DELETE' })
      } catch (err) {
        console.error(err)
      }
      router.push('/dashboard')
    }
  }

  const answeredForCurrent = answers[question.id]

  // Shared options renderer
  function renderOptions() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {OPTIONS.map(opt => {
          const isSelected = answeredForCurrent === opt
          const isCorrect = opt === question.correctAnswer
          const hasAnswered = !!answeredForCurrent
          let className = 'option-card'
          if (hasAnswered) {
            if (isCorrect) className += ' option-correct'
            else if (isSelected && !isCorrect) className += ' option-wrong'
            else className += ' option-disabled'
          } else if (isSelected) {
            className += ' option-selected'
          }
          return (
            <button key={opt} className={className} onClick={() => handleSelect(opt)} disabled={hasAnswered}>
              <div className="option-letter">{opt}</div>
              <span style={{ flex: 1, lineHeight: 1.6 }}>{optionTexts[opt]}</span>
              {hasAnswered && isCorrect && <span>✅</span>}
              {hasAnswered && isSelected && !isCorrect && <span>❌</span>}
            </button>
          )
        })}
      </div>
    )
  }

  // Shared feedback renderer
  function renderFeedback() {
    if (!showFeedback) return null
    return (
      <div className={`feedback-panel ${showFeedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
        <div className="feedback-title">
          {showFeedback.correct ? <><span>✅</span> Benar! Bagus sekali!</> : <><span>❌</span> Kurang tepat</>}
        </div>
        {!showFeedback.correct && (
          <div style={{ marginBottom: 'var(--sp-3)', fontSize: '0.9rem' }}>
            <strong>Jawaban benar:</strong>{' '}
            <span style={{ fontWeight: 700 }}>{showFeedback.correctAnswer}. {optionTexts[showFeedback.correctAnswer]}</span>
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--r-md)', padding: 'var(--sp-4)', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>📖 PEMBAHASAN</div>
          {showFeedback.explanation}
        </div>
        <button className="btn btn-primary" onClick={handleNext} style={{ marginTop: 'var(--sp-4)', width: '100%' }}>
          {current < totalQ - 1 ? 'Soal Berikutnya →' : 'Lihat Ringkasan'}
        </button>
      </div>
    )
  }

  // Shared navigation renderer
  function renderNav() {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--sp-2)', paddingBottom: 'var(--sp-4)', flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePrev} disabled={current === 0}>
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        <div style={{ 
          display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', 
          flex: 1, margin: '0 16px', maxHeight: '64px', overflowY: 'auto', padding: '6px 2px'
        }}>
          {session.questions.map((q, i) => (
            <button key={q.id} onClick={() => { setShowFeedback(null); setCurrent(i) }} title={`Soal ${i + 1}`} style={{
              width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: i === current ? 'var(--primary)' : answers[q.id] ? 'var(--primary-dark)' : 'var(--border)',
              transition: 'all 0.2s ease', transform: i === current ? 'scale(1.4)' : 'scale(1)', padding: 0,
            }} />
          ))}
        </div>
        {current < totalQ - 1 ? (
          <button className="btn btn-ghost btn-sm" onClick={handleNext} disabled={!answeredForCurrent}>
            Berikutnya <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting || !allAnswered}>
            {submitting ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Menyimpan...</> : <><Check size={16} /> Selesai</>}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="quiz-shell">
      {/* Header */}
      <div className="quiz-header">
        <button onClick={handleExit} className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }} title="Keluar & Batal">
          <X size={16} />
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{sectionLabel[session.section]}</span>
              <button 
                onClick={() => { setTranslateMode(!translateMode); setPopup(null); }} 
                title="Kacamata Translate (Blok teks untuk menerjemahkan)"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent',
                  cursor: 'pointer', color: translateMode ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: translateMode ? 700 : 500, padding: 0, transition: 'all 0.2s'
                }}
              >
                <Glasses size={14} /> Kacamata Translate {translateMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{current + 1} / {totalQ}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="quiz-body">

        {question.passage ? (
          /* ── Reading: 2 kolom ─────────────────────────────── */
          <div className="quiz-reading-layout">

            {/* Kiri: Passage — scrollable */}
            <div className="quiz-passage-panel">
              <div className="card" style={{ borderLeft: '4px solid var(--secondary)', minHeight: '100%' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--secondary)', marginBottom: 'var(--sp-3)' }}>
                  📖 Passage
                </div>
                <p style={{ lineHeight: 1.85, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {question.passage}
                </p>
              </div>
            </div>

            {/* Kanan: Soal + Opsi + Feedback + Nav */}
            <div className="quiz-question-panel">
              {/* Question */}
              <div className="card" style={{ borderLeft: '4px solid var(--primary)', flexShrink: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--sp-3)' }}>
                  Soal {current + 1}
                </div>
                <p style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>{question.text}</p>
              </div>

              {renderOptions()}
              {renderFeedback()}
              {renderNav()}
            </div>
          </div>

        ) : (
          /* ── Grammar: 1 kolom full-width ──────────────────── */
          <div className="quiz-container">
            {/* Question */}
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 'var(--sp-3)' }}>
                Soal {current + 1}
              </div>
              <p style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>{question.text}</p>
            </div>

            {renderOptions()}
            {renderFeedback()}
            {renderNav()}
          </div>
        )}
      </div>

      {/* Floating Translate Popup */}
      {translateMode && popup && (
        <div id="translate-popup" style={{
          position: 'fixed', top: popup.top, left: popup.left,
          background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          padding: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999, width: '300px', fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Glasses size={14} /> Terjemahan AI
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '6px', fontStyle: 'italic' }}>
            "{popup.text.length > 50 ? popup.text.substring(0, 50) + '...' : popup.text}"
          </div>
          <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {popup.loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <Loader2 size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Menerjemahkan...
              </div>
            ) : (
              popup.translation
            )}
          </div>
        </div>
      )}
    </div>
  )
}
