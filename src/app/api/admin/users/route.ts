import { requireAdmin } from '@/lib/auth'
import { createAdminSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function GET() {
  try {
    await requireAdmin()
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sessions: true } } },
    })
    return Response.json(users)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { name, email, password } = schema.parse(body)

    const supabase = createAdminSupabase()

    // Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return Response.json(
        { error: authError?.message ?? 'Gagal membuat user di Auth' },
        { status: 400 }
      )
    }

    // Buat user di database
    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        name,
        email,
        role: 'USER',
        isActive: true,
      },
    })

    return Response.json({ id: user.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Data tidak valid' }, { status: 400 })
    }
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
