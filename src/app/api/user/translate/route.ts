import { requireUser } from '@/lib/auth'
import { translateText } from '@/lib/gemini'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    await requireUser()
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Teks tidak valid' }, { status: 400 })
    }


    const translated = await translateText(text)

    return Response.json({ success: true, translated })
  } catch (error: any) {
    console.error('Translate error:', error)
    return Response.json({ error: error.message || 'Gagal menerjemahkan teks' }, { status: 500 })
  }
}
