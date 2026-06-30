'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LayoutDashboard, History, LogOut, BookOpen, Menu } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const navItems = [
  { href: '/dashboard', label: 'Latihan',  icon: LayoutDashboard },
  { href: '/history',   label: 'Riwayat',  icon: History },
]

export default function UserSidebar({ userName }: { userName: string }) {
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
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <BookOpen size={20} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">EITS</div>
          <div className="sidebar-logo-sub">English Test Studio</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
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

      <div className="sidebar-footer">
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          marginBottom: '8px',
          background: 'rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
            Logged in as
          </div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
            {userName}
          </div>
        </div>
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
