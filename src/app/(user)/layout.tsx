import { requireUser } from '@/lib/auth'
import UserSidebar from '@/components/user/UserSidebar'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireUser()

  return (
    <div className="app-shell">
      <UserSidebar userName={auth.dbUser.name} />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
