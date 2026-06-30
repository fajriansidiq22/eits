import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CheckCircle2, XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default async function SessionResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const auth = await requireUser()
  const { sessionId } = await params

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: auth.dbUser.id },
    include: {
      sessionQuestions: {
        orderBy: { order: 'asc' },
        include: { question: true, answer: true },
      },
    },
  })

  if (!session) {
    redirect('/dashboard')
  }

  if (session.status !== 'completed') {
    redirect(`/practice/${sessionId}`)
  }

  const isPassing = (session.score ?? 0) >= 70
  const isExcellent = (session.score ?? 0) >= 90

  return (
    <div className="page-content" style={{ maxWidth: '100%' }}>
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>

      {/* Score Summary */}
      <div className="card" style={{
        textAlign: 'center',
        padding: 'var(--sp-10) var(--sp-6)',
        marginBottom: 'var(--sp-8)',
        background: isExcellent
          ? 'linear-gradient(135deg, var(--success-bg), var(--primary-light))'
          : isPassing
            ? 'var(--surface)'
            : 'linear-gradient(135deg, var(--error-bg), #FFF)',
        border: `2px solid ${isExcellent ? 'var(--primary)' : isPassing ? 'var(--border)' : 'var(--error)'}`,
      }}>
        <div style={{
          width: 100, height: 100,
          borderRadius: '50%',
          background: isExcellent ? 'var(--primary)' : isPassing ? 'var(--secondary)' : 'var(--error)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', fontWeight: 800,
          margin: '0 auto var(--sp-4)',
          boxShadow: isExcellent ? 'var(--shadow-glow-green)' : 'none',
        }}>
          {isExcellent ? '🌟' : isPassing ? '👍' : '💪'}
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 'var(--sp-2)' }}>
          {session.score}%
        </h1>
        <p className="text-secondary" style={{ fontSize: '1.125rem', fontWeight: 500 }}>
          Kamu menjawab {session.correctQ} dari {session.totalQ} soal dengan benar.
        </p>
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            <RefreshCw size={18} />
            Latihan Lagi
          </Link>
        </div>
      </div>

      {/* Review Section */}
      <h2 style={{ marginBottom: 'var(--sp-4)', fontSize: '1.5rem', fontWeight: 800 }}>Review Jawaban</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
        {session.sessionQuestions.map((sq, i) => {
          const q = sq.question
          const userAnswer = sq.answer?.userAnswer
          const isCorrect = sq.answer?.isCorrect
          const hasPassage = !!q.passage

          const questionCard = (
            <div>
              {/* Nomor + Pertanyaan */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isCorrect ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: isCorrect ? 'var(--primary-dark)' : 'var(--error)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontWeight: 700, fontSize: '0.875rem'
                }}>
                  {i + 1}
                </div>
                <p style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.6, paddingTop: 2, margin: 0 }}>{q.text}</p>
              </div>

              {/* Opsi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                {[
                  { k: 'A', v: q.optionA },
                  { k: 'B', v: q.optionB },
                  { k: 'C', v: q.optionC },
                  { k: 'D', v: q.optionD },
                ].map(opt => {
                  const isUserSelected = userAnswer === opt.k
                  const isActualCorrect = q.correctAnswer === opt.k
                  let bg = 'var(--surface-2)'
                  let border = 'var(--border)'
                  let icon = null
                  if (isActualCorrect) {
                    bg = 'var(--success-bg)'; border = 'var(--success)'
                    icon = <CheckCircle2 size={16} color="var(--success)" />
                  } else if (isUserSelected && !isActualCorrect) {
                    bg = 'var(--error-bg)'; border = 'var(--error)'
                    icon = <XCircle size={16} color="var(--error)" />
                  }
                  return (
                    <div key={opt.k} style={{ padding: '10px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 'var(--r-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, width: 20 }}>{opt.k}.</span>
                      <span style={{ flex: 1 }}>{opt.v}</span>
                      {icon}
                    </div>
                  )
                })}
              </div>

              {/* Pembahasan */}
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)', marginRight: '8px' }}>💡 Pembahasan:</span>
                {q.explanation}
              </div>
            </div>
          )

          return (
            <div key={sq.id} className="card" style={{ borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`, padding: hasPassage ? '20px' : undefined }}>
              {hasPassage ? (
                /* Reading: passage kiri, soal kanan */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-6)' }}>
                  <div style={{ borderRight: '1px solid var(--border)', paddingRight: 'var(--sp-6)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--secondary)', marginBottom: 'var(--sp-3)' }}>
                      📖 Passage
                    </div>
                    <p style={{ lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{q.passage}</p>
                  </div>
                  <div>{questionCard}</div>
                </div>
              ) : (
                questionCard
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
