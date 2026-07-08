import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Section } from '@prisma/client'

const mergeSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  section: z.nativeEnum(Section),
  packageIds: z.array(z.string()).min(2, 'Pilih minimal 2 paket untuk digabungkan'),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { name, section, packageIds } = mergeSchema.parse(body)

    // Pastikan semua paket sumber ada dan sesuai section
    const sourcePackages = await prisma.questionPackage.findMany({
      where: { id: { in: packageIds }, section },
      include: {
        questions: true,
      },
    })

    if (sourcePackages.length !== packageIds.length) {
      return Response.json(
        { error: 'Beberapa paket tidak ditemukan atau section tidak cocok.' },
        { status: 400 }
      )
    }

    const allQuestions = sourcePackages.flatMap(pkg => pkg.questions)

    if (allQuestions.length === 0) {
      return Response.json(
        { error: 'Paket yang dipilih tidak memiliki soal.' },
        { status: 400 }
      )
    }

    // Buat paket baru dan salin semua soal ke dalamnya
    const newPackage = await prisma.questionPackage.create({
      data: {
        name,
        section,
        isActive: true,
        questions: {
          create: allQuestions.map(q => ({
            section: q.section,
            sourceType: q.sourceType,
            passage: q.passage,
            text: q.text,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        },
      },
      include: { _count: { select: { questions: true } } },
    })

    return Response.json(
      {
        message: `Paket "${name}" berhasil dibuat dengan ${newPackage._count.questions} soal.`,
        packageId: newPackage.id,
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('Merge error:', err)
    return Response.json({ error: 'Gagal menggabungkan paket.' }, { status: 500 })
  }
}
