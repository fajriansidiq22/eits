import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  ctx: RouteContext<'/api/user/sessions/[id]'>
) {
  try {
    const auth = await requireUser()
    const { id } = await ctx.params

    const session = await prisma.practiceSession.findFirst({
      where: { id, userId: auth.dbUser.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { answer: true },
        },
      },
    })

    if (!session) {
      return Response.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
    }

    return Response.json(session)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
