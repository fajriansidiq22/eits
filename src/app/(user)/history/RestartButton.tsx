'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Loader2 } from 'lucide-react'

export default function RestartButton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRestart() {
    if (!confirm('Apakah kamu yakin ingin mengulang latihan ini? Jawaban sebelumnya akan dihapus.')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/user/sessions/${sessionId}/restart`, {
        method: 'POST',
      })
      
      if (res.ok) {
        router.push(`/practice/${sessionId}`)
      } else {
        alert('Gagal mengulang sesi latihan.')
        setLoading(false)
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRestart}
      disabled={loading}
      className="btn btn-ghost btn-sm"
      title="Ulang Latihan"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {loading ? <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={16} />}
    </button>
  )
}
