import { prisma } from '@/lib/prisma'
import { prisma as db } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  await requireAdmin()

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { sessions: true } },
    },
  })

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Kelola User</h1>
        <p>Buat dan kelola akun user yang dapat mengakses platform latihan.</p>
      </div>
      <UsersClient users={users} />
    </div>
  )
}
