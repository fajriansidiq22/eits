import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Database, Users, BarChart2, Plus } from 'lucide-react'

export default async function AdminDashboard() {
  const [questionCount, userCount, sessionCount] = await Promise.all([
    prisma.bankQuestion.count(),
    prisma.user.count({ where: { role: 'USER', isActive: true } }),
    prisma.practiceSession.count({ where: { status: 'completed' } }),
  ])

  const recentSessions = await prisma.practiceSession.findMany({
    where: { status: 'completed' },
    orderBy: { completedAt: 'desc' },
    take: 5,
    include: {
      user: { select: { name: true } },
    },
  })

  const sectionLabel: Record<string, string> = {
    READING: 'Reading', GRAMMAR: 'Grammar', LISTENING: 'Listening', SIMULATION: 'Simulasi Ujian'
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Dashboard Admin</h1>
        <p>Selamat datang! Kelola bank soal dan user dari sini.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
            <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--r-md)', padding: '8px' }}>
              <Database size={18} color="var(--primary-dark)" />
            </div>
          </div>
          <div className="stat-value">{questionCount}</div>
          <div className="stat-label">Total Soal (Bank Soal)</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
            <div style={{ background: 'var(--secondary-light)', borderRadius: 'var(--r-md)', padding: '8px' }}>
              <Users size={18} color="var(--secondary-dark)" />
            </div>
          </div>
          <div className="stat-value">{userCount}</div>
          <div className="stat-label">User Aktif</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)' }}>
            <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--r-md)', padding: '8px' }}>
              <BarChart2 size={18} color="var(--accent-dark)" />
            </div>
          </div>
          <div className="stat-value">{sessionCount}</div>
          <div className="stat-label">Sesi Selesai</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-title">Aksi Cepat</div>
      <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-8)' }}>
        <Link href="/admin/bank/upload" className="btn btn-primary">
          <Plus size={18} />
          Upload Soal Manual
        </Link>
        <Link href="/admin/bank" className="btn btn-secondary">
          <Database size={18} />
          Lihat Bank Soal
        </Link>
      </div>

      {/* Recent Sessions */}
      <div className="section-title">Sesi Terbaru</div>
      {recentSessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Belum ada sesi</div>
            <p className="text-sm text-muted">Sesi latihan user akan muncul di sini</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Tes</th>
                <th>Skor</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.user.name}</td>
                  <td>
                    <span className="badge badge-blue">
                      {sectionLabel[s.section]}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: (s.score ?? 0) >= 70 ? 'var(--primary-dark)' : 'var(--error)',
                    }}>
                      {s.score ?? 0}%
                    </span>
                  </td>
                  <td className="text-muted text-sm">
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    }) : '-'}
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
