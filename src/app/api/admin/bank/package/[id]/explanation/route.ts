import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateBulkExplanations } from '@/lib/gemini'
import { NextRequest } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const pkg = await prisma.questionPackage.findUnique({
      where: { id },
      include: { questions: true }
    })

    if (!pkg) {
      return Response.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    if (pkg.questions.length === 0) {
      return Response.json({ error: 'Paket ini belum memiliki soal' }, { status: 400 })
    }

    // Format for bulk generation
    const questionsContext = pkg.questions.map(q => ({
      id: q.id,
      passage: q.passage || undefined,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer
    }))

    // Call Gemini to generate all explanations at once
    const generated = await generateBulkExplanations(questionsContext)

    if (!generated || generated.length === 0) {
      return Response.json({ error: 'Gagal men-generate pembahasan (hasil kosong)' }, { status: 500 })
    }

    // Update all questions
    // Since prisma does not have a single bulk update with different values per row (except via raw query),
    // we use a transaction of updates.
    await prisma.$transaction(
      generated.map(g => 
        prisma.bankQuestion.update({
          where: { id: g.id },
          data: { explanation: g.explanation }
        })
      )
    )

    return Response.json({ success: true, count: generated.length })
  } catch (error: any) {
    console.error('Bulk update explanation error:', error)
    return Response.json({ error: error.message || 'Gagal memperbarui pembahasan secara massal' }, { status: 500 })
  }
}
