import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.enum(['A', 'B', 'C', 'D']),
  })),
})

export async function POST(
  req: Request,
  ctx: RouteContext<'/api/user/sessions/[id]/submit'>
) {
  try {
    const auth = await requireUser()
    const { id } = await ctx.params
    const body = await req.json()
    const { answers } = schema.parse(body)

    // Verifikasi sesi milik user ini
    const session = await prisma.practiceSession.findFirst({
      where: { id, userId: auth.dbUser.id, status: 'ongoing' },
      include: { sessionQuestions: { include: { question: true } } },
    })

    if (!session) {
      return Response.json({ error: 'Sesi tidak ditemukan atau sudah selesai' }, { status: 404 })
    }

    // Hitung benar/salah dan simpan jawaban
    let correctQ = 0
    const answerCreates = answers.map(a => {
      const sq = session.sessionQuestions.find(sq => sq.questionId === a.questionId)
      const isCorrect = sq?.question.correctAnswer === a.answer
      if (isCorrect) correctQ++
      return {
        sessionId: id,
        sessionQuestionId: sq!.id,
        userAnswer: a.answer,
        isCorrect,
      }
    })

    const score = Math.round((correctQ / session.totalQ) * 100)

    await prisma.$transaction([
      prisma.sessionAnswer.createMany({ data: answerCreates }),
      prisma.practiceSession.update({
        where: { id },
        data: {
          correctQ,
          score,
          status: 'completed',
          completedAt: new Date(),
        },
      }),
    ])

    return Response.json({ score, correctQ, totalQ: session.totalQ })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Data tidak valid' }, { status: 400 })
    }
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
