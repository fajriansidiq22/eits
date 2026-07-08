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
      select: { id: true, _count: { select: { questions: true } } },
    })

    if (sourcePackages.length !== packageIds.length) {
      return Response.json(
        { error: 'Beberapa paket tidak ditemukan atau section tidak cocok.' },
        { status: 400 }
      )
    }

    const totalQuestions = sourcePackages.reduce((sum, p) => sum + p._count.questions, 0)

    if (totalQuestions === 0) {
      return Response.json(
        { error: 'Paket yang dipilih tidak memiliki soal.' },
        { status: 400 }
      )
    }

    // Jalankan dalam satu transaksi:
    // 1. Buat paket baru
    // 2. Pindahkan (update packageId) semua soal dari paket lama ke paket baru
    // 3. Hapus paket lama (yang sudah kosong)
    const newPackage = await prisma.$transaction(async (tx) => {
      // Buat paket baru
      const created = await tx.questionPackage.create({
        data: { name, section, isActive: true },
      })

      // Pindahkan semua soal dari paket lama ke paket baru
      await tx.bankQuestion.updateMany({
        where: { packageId: { in: packageIds } },
        data: { packageId: created.id },
      })

      // Hapus paket lama (sudah kosong setelah soal dipindahkan)
      await tx.questionPackage.deleteMany({
        where: { id: { in: packageIds } },
      })

      return created
    })

    // Hitung total soal di paket baru
    const questionCount = await prisma.bankQuestion.count({
      where: { packageId: newPackage.id },
    })

    return Response.json(
      {
        message: `Paket "${name}" berhasil dibuat dengan ${questionCount} soal. ${packageIds.length} paket lama telah dihapus.`,
        packageId: newPackage.id,
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error('Merge error:', err)
    return Response.json({ error: 'Gagal menggabungkan paket.' }, { status: 500 })
  }
}
