'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Database,
  Users,
  BarChart2,
  LogOut,
  BookOpen,
  User,
  Menu
} from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/bank',      label: 'Bank Soal',       icon: Database },
  { href: '/admin/users',     label: 'Kelola User',     icon: Users },
  { href: '/admin/results',   label: 'Hasil Sesi',      icon: BarChart2 },
]

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <button 
        className="mobile-nav-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        <Menu size={24} />
      </button>

      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <BookOpen size={20} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">EITS</div>
          <div className="sidebar-logo-sub">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="sidebar-item-icon" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/admin/profile" style={{
          display: 'block',
          padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          marginBottom: '8px',
          background: pathname === '/admin/profile' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
          textDecoration: 'none',
          transition: 'background 0.2s ease',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
            Logged in as
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {adminName}
            </div>
            <User size={16} color={pathname === '/admin/profile' ? '#fff' : 'rgba(255,255,255,0.4)'} />
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-item"
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--sidebar-text)' }}
        >
          <LogOut size={18} className="sidebar-item-icon" />
          Keluar
        </button>
      </div>
    </aside>
    </>
  )
}
