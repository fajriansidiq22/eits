import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { Section } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser()
    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section') as Section | null

    const where = section
      ? { isActive: true, section: section }
      : { isActive: true }

    const packages = await prisma.questionPackage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true } },
      },
    })

    // Ambil paket yang sudah pernah dikerjakan user
    const userDoneQuestions = await prisma.sessionQuestion.findMany({
      where: { session: { userId: auth.dbUser.id, isRandom: false } },
      select: { question: { select: { packageId: true } } },
    })
    const donePackageIds = new Set(
      userDoneQuestions.map(q => q.question.packageId).filter(Boolean)
    )

    const result = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      section: pkg.section,
      questionCount: pkg._count.questions,
      createdAt: pkg.createdAt,
      isDone: donePackageIds.has(pkg.id),
    }))

    return Response.json(result)
  } catch (err) {
    console.error('Packages fetch error:', err)
    return Response.json({ error: 'Gagal memuat daftar paket.' }, { status: 500 })
  }
}
