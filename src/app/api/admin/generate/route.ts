import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { generateQuestions } from '@/lib/gemini'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  section: z.enum(['READING', 'GRAMMAR']),
  model: z.string().optional(),
  sourcePackageIds: z.array(z.string()).min(1, "Pilih minimal 1 paket referensi"),
})

// Helper to convert index to A, B, C... Z, AA, AB...
function getPackageName(index: number): string {
  let name = ''
  let num = index
  while (num >= 0) {
    name = String.fromCharCode(65 + (num % 26)) + name
    num = Math.floor(num / 26) - 1
  }
  return name
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { section, model: aiModel, sourcePackageIds } = schema.parse(body)

    // Get all existing packages for this section to determine the next available name
    // This prevents Unique Constraint errors if a previous package was deleted
    const existingPackages = await prisma.questionPackage.findMany({
      where: { section },
      select: { name: true }
    })
    const existingNames = new Set(existingPackages.map(p => p.name))
    
    let index = 0
    let packageName = getPackageName(index)
    while (existingNames.has(packageName)) {
      index++
      packageName = getPackageName(index)
    }

    // Fetch questions from the selected reference packages
    const originalQuestions = await prisma.bankQuestion.findMany({
      where: { section, packageId: { in: sourcePackageIds } },
      take: 12, // Ambil maksimal 12 soal sebagai referensi agar tidak kehabisan token context
    })

    if (originalQuestions.length === 0) {
      return Response.json(
        { error: `Paket referensi yang dipilih tidak memiliki soal.` },
        { status: 400 }
      )
    }

    const passage = section === 'READING'
      ? originalQuestions.find(q => q.passage)?.passage ?? undefined
      : undefined

    const trainingJson = JSON.stringify(
      originalQuestions.map(e => ({
        text: e.text,
        option_a: e.optionA,
        option_b: e.optionB,
        option_c: e.optionC,
        option_d: e.optionD,
        answer: e.correctAnswer,
        explanation: e.explanation,
      })),
      null, 2
    )

    // Call Gemini to generate 30 questions
    const generated = await generateQuestions({
      section: section.toLowerCase() as 'reading' | 'grammar',
      count: 30, // 30 questions per package
      trainingExamples: trainingJson,
      passage,
      modelName: aiModel,
    })

    if (!generated || generated.length === 0) {
      return Response.json({ error: 'AI gagal generate soal. Coba lagi.' }, { status: 500 })
    }

    // Save package and questions
    const pkg = await prisma.questionPackage.create({
      data: {
        name: packageName,
        section,
        questions: {
          create: generated.map(q => ({
            section,
            sourceType: 'GENERATED',
            passage: q.passage ?? null,
            text: q.text,
            optionA: q.option_a,
            optionB: q.option_b,
            optionC: q.option_c,
            optionD: q.option_d,
            correctAnswer: q.answer,
            explanation: q.explanation,
          })),
        },
      },
    })

    return Response.json({ packageId: pkg.id }, { status: 201 })
  } catch (err) {
    console.error('Admin generate error:', err)
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Parameter tidak valid' }, { status: 400 })
    }
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan internal. Coba lagi.'
    return Response.json({ error: msg }, { status: 500 })
  }
}
