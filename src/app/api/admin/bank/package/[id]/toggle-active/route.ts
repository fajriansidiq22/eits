import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const pkg = await prisma.questionPackage.findUnique({ where: { id } })
    if (!pkg) {
      return Response.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.questionPackage.update({
      where: { id },
      data: { isActive: !pkg.isActive }
    })

    return Response.json({ success: true, isActive: updated.isActive })
  } catch (error) {
    console.error('Toggle active error:', error)
    return Response.json({ error: 'Terjadi kesalahan internal.' }, { status: 500 })
  }
}
