import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { Section } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    await requireUser()
    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section') as Section | null

    const where = section ? { isActive: true, section } : { isActive: true }

    const packages = await prisma.questionPackage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true } },
      },
    })

    const result = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      section: pkg.section,
      questionCount: pkg._count.questions,
      createdAt: pkg.createdAt,
    }))

    return Response.json(result)
  } catch (err) {
    console.error('Review packages fetch error:', err)
    return Response.json({ error: 'Gagal memuat daftar paket.' }, { status: 500 })
  }
}
