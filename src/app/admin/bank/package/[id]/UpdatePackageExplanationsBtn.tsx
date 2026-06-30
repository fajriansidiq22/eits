'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UpdatePackageExplanationsBtn({ packageId, totalQuestions }: { packageId: string, totalQuestions: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpdateBulk() {
    if (!confirm(`Apakah Anda yakin ingin memperbarui seluruh ${totalQuestions} pembahasan di paket ini menggunakan AI?\nProses ini mungkin memakan waktu hingga ~30 detik.`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bank/package/${packageId}/explanation`, {
        method: 'PUT'
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal memperbarui pembahasan paket')
      } else {
        alert('Berhasil memperbarui semua pembahasan di paket ini!')
        router.refresh()
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpdateBulk}
      disabled={loading || totalQuestions === 0}
      className="btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 'var(--r-md)',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: (loading || totalQuestions === 0) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: (loading || totalQuestions === 0) ? 0.7 : 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      title="Perbarui Semua Pembahasan dengan AI Sekaligus"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Memproses {totalQuestions} Soal...</span>
        </>
      ) : (
        <>
          <Sparkles size={16} />
          <span>Update Semua Pembahasan (AI)</span>
        </>
      )}
    </button>
  )
}
