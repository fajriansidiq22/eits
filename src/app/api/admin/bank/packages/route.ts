import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { Section } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section') as Section | null

    const packages = await prisma.questionPackage.findMany({
      where: section ? { section } : {},
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    })

    return Response.json(packages)
  } catch (err) {
    console.error('Admin packages fetch error:', err)
    return Response.json({ error: 'Gagal memuat daftar paket.' }, { status: 500 })
  }
}
