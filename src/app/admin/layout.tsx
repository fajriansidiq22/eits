import { requireAdmin } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin()

  return (
    <div className="app-shell">
      <AdminSidebar adminName={auth.dbUser.name} />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
