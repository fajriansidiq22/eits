import { createServerSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export type AuthUser = {
  id: string        // Supabase Auth UUID
  email: string
  dbUser: {
    id: string      // Prisma cuid
    name: string
    role: 'ADMIN' | 'USER'
    isActive: boolean
  }
}

/**
 * Ambil user yang sedang login beserta data dari DB.
 * Jika tidak ada session, redirect ke /login.
 */
export async function requireAuth(): Promise<AuthUser> {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  console.log('Auth: user from supabase:', user.id)
  
  console.log('Auth: fetching user from Prisma...')
  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, name: true, role: true, isActive: true },
  })
  console.log('Auth: Prisma returned:', dbUser?.id)

  if (!dbUser || !dbUser.isActive) {
    await supabase.auth.signOut()
    redirect('/login?error=account_inactive')
  }

  return {
    id: user.id,
    email: user.email!,
    dbUser,
  }
}

/**
 * Hanya izinkan ADMIN. Redirect jika bukan admin.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const authUser = await requireAuth()
  if (authUser.dbUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  return authUser
}

/**
 * Hanya izinkan USER. Redirect jika bukan user biasa.
 */
export async function requireUser(): Promise<AuthUser> {
  const authUser = await requireAuth()
  if (authUser.dbUser.role !== 'USER') {
    redirect('/admin/dashboard')
  }
  return authUser
}
