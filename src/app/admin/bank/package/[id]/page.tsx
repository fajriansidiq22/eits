import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import UpdateExplanationBtn from './UpdateExplanationBtn'
import UpdatePackageExplanationsBtn from './UpdatePackageExplanationsBtn'

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const pkg = await prisma.questionPackage.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { createdAt: 'asc' } }
    }
  })

  if (!pkg) return notFound()

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Link href="/admin/bank" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
            <ArrowLeft size={16} /> Kembali
          </Link>
          <h1>Paket {pkg.name}</h1>
          <p>Section: <span className="badge badge-blue">{pkg.section}</span> | Total: {pkg.questions.length} Soal</p>
        </div>
        <div style={{ marginTop: 'auto', paddingBottom: '8px' }}>
          <UpdatePackageExplanationsBtn packageId={pkg.id} totalQuestions={pkg.questions.length} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
        {pkg.questions.map((q, i) => {
          const hasPassage = !!q.passage
          
          const questionCard = (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontWeight: 700, fontSize: '0.875rem'
                }}>
                  {i + 1}
                </div>
                <p style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.6, paddingTop: 2, margin: 0 }}>{q.text}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                {[
                  { k: 'A', v: q.optionA },
                  { k: 'B', v: q.optionB },
                  { k: 'C', v: q.optionC },
                  { k: 'D', v: q.optionD },
                ].map(opt => {
                  const isCorrect = q.correctAnswer === opt.k
                  return (
                    <div key={opt.k} style={{ 
                      padding: '10px 14px', 
                      background: isCorrect ? 'var(--success-bg)' : 'var(--surface-2)', 
                      border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--border)'}`, 
                      borderRadius: 'var(--r-md)', 
                      fontSize: '0.875rem', 
                      display: 'flex', alignItems: 'center', gap: '8px' 
                    }}>
                      <span style={{ fontWeight: 700, width: 20 }}>{opt.k}.</span>
                      <span style={{ flex: 1 }}>{opt.v}</span>
                      {isCorrect && <CheckCircle2 size={16} color="var(--success)" />}
                    </div>
                  )
                })}
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>💡 Pembahasan:</span>
                  <UpdateExplanationBtn questionId={q.id} />
                </div>
                <div>{q.explanation}</div>
              </div>
            </div>
          )

          return (
            <div key={q.id} className="card" style={{ padding: hasPassage ? '20px' : undefined }}>
              {hasPassage ? (
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
