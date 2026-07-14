import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/bank/package/[id]'>
) {
  try {
    await requireAdmin()
    const { id } = await ctx.params
    const body = await req.json()
    const name: string = (body.name ?? '').trim()

    if (!name) {
      return Response.json({ error: 'Nama paket tidak boleh kosong.' }, { status: 400 })
    }

    const pkg = await prisma.questionPackage.findUnique({ where: { id } })
    if (!pkg) {
      return Response.json({ error: 'Paket tidak ditemukan.' }, { status: 404 })
    }

    // Check unique constraint [name, section]
    const existing = await prisma.questionPackage.findFirst({
      where: { name, section: pkg.section, NOT: { id } },
    })
    if (existing) {
      return Response.json({ error: `Nama "${name}" sudah digunakan untuk section ${pkg.section}.` }, { status: 409 })
    }

    const updated = await prisma.questionPackage.update({
      where: { id },
      data: { name },
    })

    return Response.json({ success: true, name: updated.name })
  } catch (error) {
    console.error('Rename package error:', error)
    return Response.json({ error: 'Gagal mengganti nama paket.' }, { status: 500 })
  }
}

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
