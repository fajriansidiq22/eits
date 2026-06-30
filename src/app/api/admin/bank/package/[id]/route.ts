import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/bank/package/[id]'>
) {
  try {
    await requireAdmin()
    const { id } = await ctx.params

    // Prisma Cascade delete on QuestionPackage will also delete BankQuestion (and SessionQuestion if relation is set to cascade)
    // Actually wait, let's verify schema.
    // QuestionPackage -> BankQuestion: @relation(fields: [packageId], references: [id], onDelete: Cascade)
    
    await prisma.questionPackage.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete package error:', error)
    return Response.json({ error: 'Gagal menghapus paket. Terjadi kesalahan pada server.' }, { status: 500 })
  }
}
