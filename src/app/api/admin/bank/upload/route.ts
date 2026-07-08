import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const questionSchema = z.object({
  passage: z.string().optional(),
  text: z.string(),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string(),
})

// Support format array lama (flat)
const arraySchema = z.array(questionSchema).min(1)

// Support format object lama (dengan passage global)
const objectSchema = z.object({
  passage: z.string().optional(),
  questions: z.array(z.object({
    text: z.string(),
    option_a: z.string(),
    option_b: z.string(),
    option_c: z.string(),
    option_d: z.string(),
    answer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string(),
  })).min(1)
})

// Support format TOEFL Grammar (part_a, part_b, dll)
const toeflGrammarSchema = z.object({
  title: z.string().optional(),
  test_type: z.string().optional(),
  section: z.string().optional(),
  instruction: z.string().optional(),
  questions: z.array(z.object({
    text: z.string(),
    part_a: z.string(),
    part_b: z.string(),
    part_c: z.string(),
    part_d: z.string(),
    answer: z.string().optional(),
    explanation: z.string(),
  })).min(1)
})

const schema = z.object({
  section: z.enum(['READING', 'GRAMMAR']),
  data: z.any(), // Di-parse manual di bawah
})

function getPackageName(index: number): string {
  let name = ''
  let num = index
  while (num >= 0) {
    name = String.fromCharCode(65 + (num % 26)) + name
    num = Math.floor(num / 26) - 1
  }
  return name
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { section, data } = schema.parse(body)

    let finalData: Array<z.infer<typeof questionSchema>> = []

    if (Array.isArray(data)) {
      finalData = arraySchema.parse(data)
    } else if (data.questions && data.questions[0] && 'part_a' in data.questions[0]) {
      // Format TOEFL Grammar
      const parsedObj = toeflGrammarSchema.parse(data)
      finalData = parsedObj.questions.map(q => {
        let ans = q.answer?.trim().toUpperCase().charAt(0) || 'A'
        if (!['A', 'B', 'C', 'D'].includes(ans)) {
          ans = 'A' // Fallback
        }
        return {
          text: q.text,
          option_a: q.part_a,
          option_b: q.part_b,
          option_c: q.part_c,
          option_d: q.part_d,
          answer: ans as 'A'|'B'|'C'|'D',
          explanation: q.explanation
        }
      })
    } else {
      const parsedObj = objectSchema.parse(data)
      // Gabungkan passage ke setiap soal
      finalData = parsedObj.questions.map(q => ({
        ...q,
        passage: parsedObj.passage
      }))
    }

    // Hitung jumlah paket asli untuk section ini agar bisa dinamai "Manual A", "Manual B", dst.
    const count = await prisma.questionPackage.count({
      where: { section, name: { startsWith: 'Manual ' } }
    })
    
    const packageName = `Manual ${getPackageName(count)}`

    // Simpan paket dan soal
    const pkg = await prisma.questionPackage.create({
      data: {
        name: packageName,
        section,
        questions: {
          create: finalData.map(q => ({
            section,
            sourceType: 'ORIGINAL',
            passage: q.passage ?? null,
            text: q.text,
            optionA: q.option_a,
            optionB: q.option_b,
            optionC: q.option_c,
            optionD: q.option_d,
            correctAnswer: q.answer,
            explanation: q.explanation,
          })),
        },
      },
    })

    return Response.json({ success: true, packageId: pkg.id }, { status: 201 })
  } catch (err) {
    console.error('Upload training error:', err)
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Format JSON tidak sesuai dengan skema yang didukung.' }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
