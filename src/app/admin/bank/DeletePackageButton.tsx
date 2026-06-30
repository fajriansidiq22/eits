'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeletePackageButton({ id, name }: { id: string, name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Apakah Anda yakin ingin menghapus Paket ${name}? Semua soal di dalam paket ini akan ikut terhapus secara permanen.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bank/package/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Gagal menghapus paket')
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
      onClick={handleDelete}
      disabled={loading}
      className="btn btn-danger"
      style={{ padding: '6px 12px' }}
      title="Hapus Paket"
    >
      {loading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
    </button>
  )
}
