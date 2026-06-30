import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    const body = await req.json()
    const { password } = schema.parse(body)

    const { createAdminSupabase } = await import('@/lib/supabase')
    const supabase = createAdminSupabase()
    const { error } = await supabase.auth.admin.updateUserById(auth.id, { password })

    if (error) {
      console.error('Supabase password update error:', error.message)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: (err as any).errors[0].message }, { status: 400 })
    }
    console.error('Password update error:', err)
    return Response.json({ error: 'Gagal memperbarui password' }, { status: 500 })
  }
}
