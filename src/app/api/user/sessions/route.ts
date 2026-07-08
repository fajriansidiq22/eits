import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Section } from '@prisma/client'

const schema = z.object({
  section: z.enum(['READING', 'GRAMMAR', 'SIMULATION']),
  mode: z.enum(['PACKAGE', 'RANDOM', 'CHOOSE']),
  count: z.number().min(5).max(60).optional(),
  packageId: z.string().optional(), // untuk mode CHOOSE
})

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser()
    const body = await req.json()
    const { section, mode, count, packageId } = schema.parse(body)

    // Anti-spam: Batasi user hanya bisa generate 1x setiap menit
    const lastSession = await prisma.practiceSession.findFirst({
      where: { userId: auth.dbUser.id },
      orderBy: { startedAt: 'desc' },
    })

    if (lastSession) {
      const diffInMs = Date.now() - lastSession.startedAt.getTime()
      const COOLDOWN = 60 * 1000 // 1 menit
      if (diffInMs < COOLDOWN) {
        const sisa = Math.ceil((COOLDOWN - diffInMs) / 1000)
        return Response.json({ error: `Harap tunggu ${sisa} detik lagi sebelum memulai sesi baru.` }, { status: 429 })
      }
    }

    let selectedQuestionIds: string[] = []

    if (mode === 'CHOOSE') {
      // Mode: User pilih paket sendiri
      if (!packageId) {
        return Response.json({ error: 'packageId wajib diisi pada mode CHOOSE.' }, { status: 400 })
      }
      const pkg = await prisma.questionPackage.findFirst({
        where: { id: packageId, isActive: true },
        include: { questions: { select: { id: true } } },
      })
      if (!pkg) {
        return Response.json({ error: 'Paket tidak ditemukan atau tidak aktif.' }, { status: 404 })
      }
      selectedQuestionIds = pkg.questions.map(q => q.id)

    } else if (mode === 'PACKAGE') {
      // Helper function to pick an uncompleted package for a specific section
      async function pickUncompletedPackage(targetSection: Section) {
        // 1. Dapatkan paket yang pernah dikerjakan user
        const userDoneQuestions = await prisma.sessionQuestion.findMany({
          where: { session: { userId: auth.dbUser.id, isRandom: false } },
          select: { question: { select: { packageId: true } } },
        })
        const donePackageIds = new Set(userDoneQuestions.map(q => q.question.packageId).filter(Boolean))

        // 2. Dapatkan semua paket untuk section target
        const allPackages = await prisma.questionPackage.findMany({
          where: { section: targetSection, isActive: true },
          select: { id: true },
        })

        if (allPackages.length === 0) return null

        // 3. Filter paket yang belum dikerjakan
        let availablePackages = allPackages.filter(p => !donePackageIds.has(p.id))
        
        // 4. Jika semua sudah dikerjakan, acak dari semua paket
        if (availablePackages.length === 0) {
          availablePackages = allPackages
        }

        // 5. Pilih acak 1 paket
        const chosen = availablePackages[Math.floor(Math.random() * availablePackages.length)]
        
        // 6. Ambil semua soal dari paket tersebut
        const questions = await prisma.bankQuestion.findMany({
          where: { packageId: chosen.id },
          select: { id: true }
        })
        return questions.map(q => q.id)
      }

      if (section === 'SIMULATION') {
        const readingIds = await pickUncompletedPackage('READING')
        const grammarIds = await pickUncompletedPackage('GRAMMAR')

        if (!readingIds || !grammarIds) {
          return Response.json({ error: 'Paket soal tidak cukup untuk Simulasi Ujian.' }, { status: 400 })
        }
        // Gabungkan
        selectedQuestionIds = [...readingIds, ...grammarIds]
      } else {
        const ids = await pickUncompletedPackage(section as Section)
        if (!ids) {
          return Response.json({ error: `Belum ada paket untuk section ${section}.` }, { status: 400 })
        }
        selectedQuestionIds = ids
      }

    } else {
      // MODE RANDOM
      const takeCount = count || 10

      if (section === 'SIMULATION') {
        const half = Math.floor(takeCount / 2)
        const remainder = takeCount - half

        const readingQ = await prisma.bankQuestion.findMany({ where: { section: 'READING', package: { isActive: true } }, select: { id: true } })
        const grammarQ = await prisma.bankQuestion.findMany({ where: { section: 'GRAMMAR', package: { isActive: true } }, select: { id: true } })

        if (readingQ.length < half || grammarQ.length < remainder) {
          return Response.json({ error: 'Soal tidak cukup untuk acak simulasi.' }, { status: 400 })
        }

        const readingIds = readingQ.sort(() => 0.5 - Math.random()).slice(0, half).map(q => q.id)
        const grammarIds = grammarQ.sort(() => 0.5 - Math.random()).slice(0, remainder).map(q => q.id)
        selectedQuestionIds = [...readingIds, ...grammarIds].sort(() => 0.5 - Math.random())

      } else {
        const allQ = await prisma.bankQuestion.findMany({
          where: { section: section as Section, package: { isActive: true } },
          select: { id: true }
        })
        if (allQ.length === 0) {
          return Response.json({ error: `Belum ada soal untuk ${section}.` }, { status: 400 })
        }
        selectedQuestionIds = allQ.sort(() => 0.5 - Math.random()).slice(0, takeCount).map(q => q.id)
      }
    }

    if (selectedQuestionIds.length === 0) {
      return Response.json({ error: 'Tidak dapat menemukan soal.' }, { status: 500 })
    }

    // Buat sesi
    const session = await prisma.practiceSession.create({
      data: {
        userId: auth.dbUser.id,
        section: section as Section,
        isRandom: mode === 'RANDOM',
        totalQ: selectedQuestionIds.length,
        status: 'ongoing',
        sessionQuestions: {
          create: selectedQuestionIds.map((qId, i) => ({
            questionId: qId,
            order: i,
          })),
        },
      },
    })

    return Response.json({ sessionId: session.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Parameter tidak valid' }, { status: 400 })
    }
    console.error('Session create error:', err)
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan internal. Coba lagi.'
    return Response.json({ error: msg }, { status: 500 })
  }
}
