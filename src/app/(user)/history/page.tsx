import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import RestartButton from './RestartButton'

const sectionLabel: Record<string, string> = { 
  READING: 'Reading', 
  GRAMMAR: 'Grammar', 
  LISTENING: 'Listening',
  SIMULATION: 'Simulasi Ujian'
}

export default async function HistoryPage() {
  const auth = await requireUser()

  const sessions = await prisma.practiceSession.findMany({
    where: { userId: auth.dbUser.id, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    include: {
      sessionQuestions: {
        select: {
          question: {
            select: {
              package: { select: { name: true, section: true } }
            }
          }
        }
      }
    }
  })

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Riwayat Latihan</h1>
        <p>Lihat kembali semua sesi latihan yang pernah kamu kerjakan.</p>
      </div>

      {sessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">Belum ada riwayat latihan</div>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--sp-6)' }}>
              Ayo mulai latihan pertamamu dan tingkatkan kemampuan bahasa Inggrismu!
            </p>
            <Link href="/dashboard" className="btn btn-primary">
              Mulai Latihan <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--sp-4)' }}>
          {sessions.map((s) => {
            const isPassing = (s.score ?? 0) >= 70

            // Ekstrak nama paket unik dari soal
            const packageMap = new Map<string, string>()
            for (const sq of s.sessionQuestions) {
              if (sq.question.package) {
                const p = sq.question.package
                packageMap.set(`${p.section}-${p.name}`, `${p.section === 'READING' ? 'R' : 'G'} Pkt ${p.name}`)
              }
            }
            const packagesInfo = Array.from(packageMap.values()).join(' + ')

            return (
              <div key={s.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>
                      {sectionLabel[s.section]}
                    </div>
                    {packagesInfo && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                        {s.isRandom ? 'Soal Acak' : packagesInfo}
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: isPassing ? 'var(--success-bg)' : 'var(--error-bg)',
                    color: isPassing ? 'var(--primary-dark)' : 'var(--error)',
                    padding: '4px 12px',
                    borderRadius: 'var(--r-full)',
                    fontWeight: 800,
                    fontSize: '1rem',
                  }}>
                    {s.score}%
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--sp-5)' }}>
                  <span>{s.correctQ}/{s.totalQ} benar</span>
                  <span>
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    }) : ''}
                  </span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                  <Link
                    href={`/practice/${s.id}/results`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Review
                  </Link>
                  <RestartButton sessionId={s.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
