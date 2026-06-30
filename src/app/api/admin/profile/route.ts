import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
})

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    const body = await req.json()
    const { name } = schema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: auth.dbUser.id },
      data: { name },
    })

    return Response.json({ success: true, user: updatedUser })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: (err as any).errors[0].message }, { status: 400 })
    }
    console.error('Profile update error:', err)
    return Response.json({ error: 'Gagal memperbarui profil' }, { status: 500 })
  }
}
