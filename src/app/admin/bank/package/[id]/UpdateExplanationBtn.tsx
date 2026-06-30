'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UpdateExplanationBtn({ questionId }: { questionId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpdate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bank/question/${questionId}/explanation`, {
        method: 'PUT'
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal memperbarui pembahasan')
      } else {
        // Refresh page to show new explanation
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
      onClick={handleUpdate}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--primary-subtle)',
        color: 'var(--primary-dark)',
        border: '1px solid var(--primary-light)',
        padding: '4px 10px',
        borderRadius: 'var(--r-md)',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: loading ? 0.7 : 1,
      }}
      title="Update Pembahasan dengan AI"
    >
      {loading ? (
        <>
          <Loader2 size={12} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Memperbarui...</span>
        </>
      ) : (
        <>
          <Sparkles size={12} />
          <span>Update via AI</span>
        </>
      )}
    </button>
  )
}
