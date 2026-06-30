import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser()
    const { id: sessionId } = await ctx.params

    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    })

    if (!session || session.userId !== auth.dbUser.id) {
      return Response.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
    }

    // Reset answers and session state
    await prisma.$transaction([
      prisma.sessionAnswer.deleteMany({
        where: { sessionId },
      }),
      prisma.practiceSession.update({
        where: { id: sessionId },
        data: {
          status: 'ongoing',
          score: null,
          correctQ: 0,
          startedAt: new Date(),
          completedAt: null,
        },
      }),
    ])

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Restart session error:', error)
    return Response.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 })
  }
}
