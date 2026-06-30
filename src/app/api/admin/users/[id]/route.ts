import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  ctx: RouteContext<'/api/admin/users/[id]'>
) {
  try {
    await requireAdmin()
    const { id } = await ctx.params
    const { isActive } = await req.json()

    await prisma.user.update({
      where: { id },
      data: { isActive },
    })

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Unauthorized or not found' }, { status: 401 })
  }
}
