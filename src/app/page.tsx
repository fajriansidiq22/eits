import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const auth = await requireAuth()
  if (auth.dbUser.role === 'ADMIN') {
    redirect('/admin/dashboard')
  } else {
    redirect('/dashboard')
  }
}
