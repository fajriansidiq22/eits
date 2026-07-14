import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateBulkExplanations } from '@/lib/gemini'
import { NextRequest } from 'next/server'

// SSE streaming: processes packages one-by-one and streams progress
export async function POST(req: NextRequest) {
  await requireAdmin()

  const body = await req.json()
  const packageIds: string[] = body.packageIds ?? []
  const model: string | undefined = body.model && body.model !== 'auto' ? body.model : undefined

  if (!packageIds.length) {
    return Response.json({ error: 'Pilih minimal satu paket.' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  function send(data: object) {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  }

  const stream = new ReadableStream({
    async start(controller) {
      let totalUpdated = 0

      for (let i = 0; i < packageIds.length; i++) {
        const pkgId = packageIds[i]

        try {
          const pkg = await prisma.questionPackage.findUnique({
            where: { id: pkgId },
            include: { questions: true },
          })

          if (!pkg) {
            controller.enqueue(send({
              type: 'package_error',
              index: i,
              packageId: pkgId,
              name: '(tidak ditemukan)',
              error: 'Paket tidak ditemukan',
            }))
            continue
          }

          if (pkg.questions.length === 0) {
            controller.enqueue(send({
              type: 'package_skip',
              index: i,
              packageId: pkgId,
              name: pkg.name,
              reason: 'Tidak ada soal',
            }))
            continue
          }

          // Notify: starting this package
          controller.enqueue(send({
            type: 'package_start',
            index: i,
            packageId: pkgId,
            name: pkg.name,
            total: packageIds.length,
            questionCount: pkg.questions.length,
          }))

          const questionsContext = pkg.questions.map(q => ({
            id: q.id,
            passage: q.passage || undefined,
            text: q.text,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
          }))

          const generated = await generateBulkExplanations(questionsContext, model)

          if (!generated || generated.length === 0) {
            controller.enqueue(send({
              type: 'package_error',
              index: i,
              packageId: pkgId,
              name: pkg.name,
              error: 'AI tidak menghasilkan pembahasan',
            }))
            continue
          }

          await prisma.$transaction(
            generated.map(g =>
              prisma.bankQuestion.update({
                where: { id: g.id },
                data: { explanation: g.explanation },
              })
            )
          )

          totalUpdated += generated.length

          controller.enqueue(send({
            type: 'package_done',
            index: i,
            packageId: pkgId,
            name: pkg.name,
            count: generated.length,
            totalUpdated,
          }))
        } catch (err: any) {
          controller.enqueue(send({
            type: 'package_error',
            index: i,
            packageId: pkgId,
            name: pkgId,
            error: err?.message ?? 'Terjadi kesalahan',
          }))
        }
      }

      controller.enqueue(send({
        type: 'done',
        totalUpdated,
        totalPackages: packageIds.length,
      }))

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
