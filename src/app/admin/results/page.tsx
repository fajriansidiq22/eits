import { prisma } from '@/lib/prisma'

const sectionLabel: Record<string, string> = { READING: 'Reading', GRAMMAR: 'Grammar', LISTENING: 'Listening', SIMULATION: 'Simulasi Ujian' }

export default async function ResultsPage() {
  const sessions = await prisma.practiceSession.findMany({
    where: { status: 'completed' },
    orderBy: { completedAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  const totalSessions = sessions.length
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.score ?? 0), 0) / sessions.length)
    : 0

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Hasil Sesi</h1>
        <p>Pantau hasil latihan semua user.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <div className="stat-card">
          <div className="stat-value">{totalSessions}</div>
          <div className="stat-label">Total Sesi Selesai</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgScore}%</div>
          <div className="stat-label">Rata-rata Skor</div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Belum ada hasil sesi</div>
            <p className="text-sm text-muted">Hasil latihan user akan muncul di sini</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Tes</th>
                <th>Soal</th>
                <th>Skor</th>
                <th>Waktu Selesai</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.user.name}</td>
                  <td className="text-sm text-muted">{s.user.email}</td>
                  <td>
                    <span className="badge badge-blue">
                      {sectionLabel[s.section]}
                    </span>
                  </td>
                  <td className="text-sm">
                    {s.correctQ}/{s.totalQ} benar
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: (s.score ?? 0) >= 70
                        ? 'var(--primary-dark)'
                        : (s.score ?? 0) >= 50
                          ? 'var(--accent-dark)'
                          : 'var(--error)',
                    }}>
                      {s.score ?? 0}%
                    </span>
                  </td>
                  <td className="text-sm text-muted">
                    {s.completedAt
                      ? new Date(s.completedAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
