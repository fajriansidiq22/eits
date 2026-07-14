'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, X, Check } from 'lucide-react'

export default function RenamePackageButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(name)
      setError('')
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [open, name])

  async function handleRename() {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Nama paket tidak boleh kosong.')
      return
    }
    if (trimmed === name) {
      setOpen(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bank/package/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal mengganti nama paket.')
        setLoading(false)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Terjadi kesalahan koneksi.')
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleRename()
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <>
      {/* Rename Button */}
      <button
        onClick={() => setOpen(true)}
        className="btn"
        style={{
          padding: '6px 12px',
          fontSize: '0.8125rem',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-primary)',
        }}
        title="Ganti Nama Paket"
      >
        <Pencil size={15} />
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '28px 32px',
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ✏️ Ganti Nama Paket
              </h3>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="rename-pkg-input"
                style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}
              >
                Nama Paket Baru
              </label>
              <input
                id="rename-pkg-input"
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Masukkan nama paket..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
              />
              {error && (
                <p style={{ color: 'var(--error)', fontSize: '0.8rem', margin: '6px 0 0', fontWeight: 500 }}>
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: '8px 18px' }}
              >
                Batal
              </button>
              <button
                onClick={handleRename}
                disabled={loading || !value.trim()}
                className="btn btn-primary"
                style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {loading ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
