import { GoogleGenerativeAI } from '@google/generative-ai'
import { MODELS_TO_TRY } from './gemini-constants'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface GenerateConfig {
  section: 'reading' | 'grammar'
  count: number
  trainingExamples: string // JSON string dari training examples
  passage?: string         // hanya untuk reading
  modelName?: string       // specific model or 'auto'
}

export interface GeneratedQuestionRaw {
  passage?: string
  text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  answer: string
  explanation: string
}

export async function generateQuestions(
  config: GenerateConfig
): Promise<GeneratedQuestionRaw[]> {
  const prompt = buildPrompt(config)
  
  let raw = ''
  let lastError: any = null

  const modelsToTry = config.modelName && config.modelName !== 'auto' 
    ? [config.modelName] 
    : MODELS_TO_TRY

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Mencoba model: ${modelName}`)
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.8,
          responseMimeType: 'application/json',
        },
      })
      const result = await model.generateContent(prompt)
      raw = result.response.text()
      break // Berhasil, keluar dari loop
    } catch (err: any) {
      console.warn(`[Gemini] Model ${modelName} gagal:`, err?.message || err)
      lastError = err
      // Lanjut ke model cadangan berikutnya
    }
  }

  if (!raw) {
    throw new Error('Semua model AI cadangan gagal digunakan (mungkin terkena Limit/Error). Detail: ' + (lastError?.message || 'Unknown error'))
  }

  try {
    const parsed = JSON.parse(raw)
    const arr: GeneratedQuestionRaw[] = Array.isArray(parsed)
      ? parsed
      : parsed.questions ?? []
    return arr.slice(0, config.count)
  } catch {
    throw new Error('Gagal memparse hasil dari AI. Coba lagi.')
  }
}

function buildPrompt(config: GenerateConfig): string {
  const sectionLabel =
    config.section === 'reading' ? 'Reading Comprehension' : 'Grammar & Structure'

  const passageInstruction =
    config.section === 'reading'
      ? `Buat SATU passage baru (150-250 kata) tentang topik akademis atau sains populer, lalu buat ${config.count} soal berdasarkan passage tersebut. Setiap soal harus memiliki field "passage" yang berisi teks passage tersebut.`
      : `Buat ${config.count} soal grammar/struktur bahasa Inggris yang bervariasi (tenses, prepositions, articles, subject-verb agreement, conjunctions, dll). Tidak perlu passage.`

  return `
Kamu adalah pembuat soal tes bahasa Inggris profesional.
Bagian: ${sectionLabel}

TUGAS:
${passageInstruction}

ATURAN KETAT:
1. Setiap soal WAJIB memiliki: text, option_a, option_b, option_c, option_d, answer (hanya "A"/"B"/"C"/"D"), explanation
2. "explanation" HARUS SANGAT DETAIL DAN LENGKAP. Jelaskan konsep/materi grammar atau reading yang diuji, berikan alasan komprehensif mengapa jawaban tersebut benar, dan jelaskan secara spesifik mengapa masing-masing opsi lainnya (A, B, C, D) salah.
3. Soal harus ORIGINAL — tidak boleh copy-paste dari contoh di bawah
4. Tingkat kesulitan: menengah hingga tinggi
5. Bahasa soal: Inggris. Bahasa untuk "explanation": Bahasa Indonesia yang baku dan mudah dipahami, boleh menyisipkan istilah Inggris jika perlu.
6. Variasikan jenis pertanyaan: main idea, detail, inference, vocabulary, dll (untuk Reading)
7. Jangan pelit kata pada "explanation", buatlah layaknya buku pembahasan soal (minimal 3-5 kalimat).

CONTOH SOAL (referensi gaya & format saja):
${config.trainingExamples}

OUTPUT FORMAT:
Kembalikan HANYA JSON array, tanpa markdown, tanpa komentar:
[
  {
    ${config.section === 'reading' ? '"passage": "teks passage di sini (sama untuk semua soal dalam 1 set)",' : ''}
    "text": "pertanyaan di sini",
    "option_a": "opsi A",
    "option_b": "opsi B",
    "option_c": "opsi C",
    "option_d": "opsi D",
    "answer": "B",
    "explanation": "Jawaban B benar karena... Opsi A salah karena... dst"
  }
]
`.trim()
}

export interface QuestionContext {
  passage?: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
}

export async function generateExplanationForQuestion(q: QuestionContext): Promise<string> {
  const prompt = `
Kamu adalah guru bahasa Inggris ahli.
Tugas: Buat pembahasan SATU soal pilihan ganda bahasa Inggris berikut.
${q.passage ? `\nPassage:\n${q.passage}\n` : ''}
Pertanyaan: ${q.text}
A. ${q.optionA}
B. ${q.optionB}
C. ${q.optionC}
D. ${q.optionD}

Jawaban Benar: ${q.correctAnswer}

ATURAN:
1. "explanation" HARUS SANGAT DETAIL DAN LENGKAP.
2. Jelaskan konsep/materi grammar atau reading yang diuji.
3. Berikan alasan komprehensif mengapa jawaban benar, dan jelaskan mengapa opsi lainnya salah.
4. Jangan pelit kata, buatlah layaknya buku pembahasan (minimal 3-5 kalimat).
5. Format bahasa: Bahasa Indonesia yang baku dan mudah dipahami.
6. Kembalikan HANYA teks pembahasan langsung, tanpa tambahan "Berikut adalah pembahasan" atau basa-basi lainnya, tanpa memformat dengan markdown yang tidak perlu.
`.trim()

  let raw = ''
  let lastError: any = null

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`[Gemini Explanation] Mencoba model: ${modelName}`)
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
        },
      })
      const result = await model.generateContent(prompt)
      raw = result.response.text()
      break
    } catch (err: any) {
      console.warn(`[Gemini Explanation] Model ${modelName} gagal:`, err?.message || err)
      lastError = err
    }
  }

  if (!raw) {
    throw new Error('Semua model gagal (Limit/Error).')
  }

  return raw.trim()
}

export interface BulkExplanationContext {
  id: string
  passage?: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
}

export async function generateBulkExplanations(questions: BulkExplanationContext[], preferredModel?: string): Promise<{id: string, explanation: string}[]> {
  const prompt = `
Kamu adalah guru bahasa Inggris ahli.
Tugas: Buat pembahasan detail untuk kumpulan soal pilihan ganda berikut.

ATURAN:
1. "explanation" HARUS SANGAT DETAIL DAN LENGKAP (minimal 3-5 kalimat).
2. Jelaskan konsep/materi grammar atau reading yang diuji, alasan jawaban benar, dan alasan opsi lainnya salah.
3. Bahasa: Bahasa Indonesia yang baku dan mudah dipahami.
4. Kembalikan HANYA JSON array dengan format persis seperti ini:
[
  {
    "id": "id-soal",
    "explanation": "pembahasan detail..."
  }
]
DILARANG memberikan teks lain selain JSON array.

DAFTAR SOAL:
${JSON.stringify(questions, null, 2)}
`.trim()

  let raw = ''
  let lastError: any = null

  const modelsToTry = preferredModel && preferredModel !== 'auto'
    ? [preferredModel]
    : MODELS_TO_TRY

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini Bulk Explanations] Mencoba model: ${modelName}`)
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        },
      })
      const result = await model.generateContent(prompt)
      raw = result.response.text()
      break
    } catch (err: any) {
      console.warn(`[Gemini Bulk Explanations] Model ${modelName} gagal:`, err?.message || err)
      lastError = err
    }
  }

  if (!raw) {
    throw new Error('Semua model gagal memproses bulk update (Limit/Error).')
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    throw new Error('Gagal memparse hasil dari AI. Coba lagi.')
  }
}

export async function translateText(text: string): Promise<string> {
  const prompt = `Terjemahkan teks bahasa Inggris berikut ke bahasa Indonesia secara akurat, kontekstual, dan natural.
Teks: "${text}"

ATURAN:
1. Kembalikan HANYA teks hasil terjemahannya saja.
2. Dilarang memberikan basa-basi, tanda kutip ekstra, atau penjelasan apa pun.
`.trim()

  const TRANSLATE_MODELS = [
    'gemini-3.5-live-translate', // from user screenshot
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite'
  ]

  let raw = ''
  let lastError: any = null

  for (const modelName of TRANSLATE_MODELS) {
    try {
      console.log(`[Gemini Translate] Mencoba model: ${modelName}`)
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.3, // Lower temperature for more accurate translation
        },
      })
      const result = await model.generateContent(prompt)
      raw = result.response.text()
      break
    } catch (err: any) {
      console.warn(`[Gemini Translate] Model ${modelName} gagal:`, err?.message || err)
      lastError = err
    }
  }

  if (!raw) {
    throw new Error('Semua model terjemahan gagal (Limit/Error).')
  }

  return raw.trim()
}
