import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateExplanationForQuestion } from '@/lib/gemini'
import { NextRequest } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const question = await prisma.bankQuestion.findUnique({
      where: { id }
    })

    if (!question) {
      return Response.json({ error: 'Pertanyaan tidak ditemukan' }, { status: 404 })
    }

    // Call Gemini to generate a new explanation
    const newExplanation = await generateExplanationForQuestion({
      passage: question.passage || undefined,
      text: question.text,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer
    })

    const updated = await prisma.bankQuestion.update({
      where: { id },
      data: { explanation: newExplanation }
    })

    return Response.json({ success: true, explanation: updated.explanation })
  } catch (error: any) {
    console.error('Update explanation error:', error)
    return Response.json({ error: error.message || 'Gagal memperbarui pembahasan' }, { status: 500 })
  }
}
