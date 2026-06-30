'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, EyeOff, Eye } from 'lucide-react'

export default function TogglePackageButton({ id, isActive, name }: { id: string, isActive: boolean, name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const action = isActive ? 'menonaktifkan' : 'mengaktifkan'
    if (!confirm(`Apakah Anda yakin ingin ${action} Paket ${name}?`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bank/package/${id}/toggle-active`, { method: 'PUT' })
      if (!res.ok) {
        alert('Gagal mengubah status paket')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      alert('Terjadi kesalahan koneksi.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
      style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
      title={isActive ? "Nonaktifkan Paket" : "Aktifkan Paket"}
    >
      {loading ? (
        <Loader2 size={15} className="spin" />
      ) : isActive ? (
        <><EyeOff size={15} /> Nonaktifkan</>
      ) : (
        <><Eye size={15} /> Aktifkan</>
      )}
    </button>
  )
}
