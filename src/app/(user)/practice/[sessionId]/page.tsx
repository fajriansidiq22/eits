import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PracticeClient from './PracticeClient'

export default async function PracticePage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  await requireUser()
  const { sessionId } = await params

  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    include: {
      sessionQuestions: { 
        include: { question: true },
        orderBy: { order: 'asc' } 
      },
    },
  })

  if (!session || session.status === 'completed') {
    redirect('/dashboard')
  }

  // Transform sessionQuestions to match the existing Session shape expected by PracticeClient
  const mappedSession = {
    ...session,
    questions: session.sessionQuestions.map(sq => ({
      ...sq.question,
      order: sq.order
    }))
  }

  return <PracticeClient session={mappedSession as any} />
}
