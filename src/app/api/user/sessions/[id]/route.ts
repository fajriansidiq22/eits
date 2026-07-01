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
        sessionQuestions: {
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

export async function DELETE(
  _req: Request,
  ctx: RouteContext<'/api/user/sessions/[id]'>
) {
  try {
    const auth = await requireUser()
    const { id } = await ctx.params

    const session = await prisma.practiceSession.findFirst({
      where: { id, userId: auth.dbUser.id },
    })

    if (!session) {
      return Response.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
    }

    if (session.status !== 'ongoing') {
      return Response.json({ error: 'Hanya sesi yang belum selesai yang bisa dibatalkan' }, { status: 400 })
    }

    await prisma.practiceSession.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
