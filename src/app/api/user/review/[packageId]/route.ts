import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { notFound } from 'next/navigation'

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/user/review/[packageId]'>
) {
  try {
    await requireUser()
    const { packageId } = await ctx.params

    const pkg = await prisma.questionPackage.findFirst({
      where: { id: packageId, isActive: true },
      include: {
        questions: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!pkg) {
      return Response.json({ error: 'Paket tidak ditemukan.' }, { status: 404 })
    }

    return Response.json({
      id: pkg.id,
      name: pkg.name,
      section: pkg.section,
      questions: pkg.questions.map(q => ({
        id: q.id,
        passage: q.passage,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    })
  } catch (err) {
    console.error('Review package detail error:', err)
    return Response.json({ error: 'Gagal memuat detail paket.' }, { status: 500 })
  }
}
