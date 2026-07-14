import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Sparkles, Eye, List, Merge } from 'lucide-react'
import DeletePackageButton from './DeletePackageButton'
import TogglePackageButton from './TogglePackageButton'
import RenamePackageButton from './RenamePackageButton'

export default async function BankPage() {
  const packages = await prisma.questionPackage.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } },
  })

  const originalCount = await prisma.bankQuestion.count({
    where: { sourceType: 'ORIGINAL' }
  })

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Bank Soal</h1>
          <p>Kelola koleksi soal asli dan paket soal yang digenerate oleh AI.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <Link href="/admin/bank/upload" className="btn btn-secondary">
            <Plus size={18} />
            Upload Soal Asli
          </Link>
          <Link href="/admin/bank/merge" className="btn btn-secondary">
            <Merge size={18} />
            Gabungkan Paket
          </Link>
          <Link href="/admin/bank/generate" className="btn btn-primary">
            <Sparkles size={18} />
            Generate Paket AI
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-8)' }}>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Paket Soal Generate</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{packages.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Soal Asli (Manual)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary-dark)' }}>{originalCount}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-4)' }}>Daftar Paket Soal AI</h2>
      
      {packages.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div className="empty-state-icon">🤖</div>
          <div className="empty-state-title">Belum ada Paket Soal</div>
          <p className="text-sm text-muted" style={{ marginBottom: '24px' }}>
            Mulai generate soal menggunakan AI untuk membuat paket soal baru.
          </p>
          <Link href="/admin/bank/generate" className="btn btn-primary">
            <Sparkles size={18} />
            Generate Paket Pertama
          </Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Paket</th>
                <th>Section</th>
                <th>Status</th>
                <th>Tipe Sumber</th>
                <th>Total Soal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id}>
                  <td style={{ fontWeight: 700 }}>{pkg.name}</td>
                  <td>
                    <span className={`badge ${pkg.section === 'READING' ? 'badge-blue' : 'badge-green'}`}>
                      {pkg.section}
                    </span>
                  </td>
                  <td>
                    {pkg.isActive ? (
                      <span className="badge badge-blue" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Aktif</span>
                    ) : (
                      <span className="badge badge-blue" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>Non-Aktif</span>
                    )}
                  </td>
                  <td>
                    {pkg.name.startsWith('Manual') ? (
                      <span className="badge badge-purple">Soal Asli</span>
                    ) : (
                      <span className="badge badge-purple" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>Generate AI</span>
                    )}
                  </td>
                  <td><span style={{ fontWeight: 700 }}>{pkg._count.questions}</span> soal</td>
                  <td className="text-muted text-sm">
                    {new Date(pkg.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href={`/admin/bank/package/${pkg.id}`} className="btn" style={{ padding: '6px 12px', fontSize: '0.8125rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}>
                      <List size={15} /> Detail
                    </Link>
                    <RenamePackageButton id={pkg.id} name={pkg.name} />
                    <TogglePackageButton id={pkg.id} isActive={pkg.isActive} name={pkg.name} />
                    <DeletePackageButton id={pkg.id} name={pkg.name} />
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
