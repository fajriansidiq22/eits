import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) { console.error('List error:', listError.message); process.exit(1) }

  const admin = users.find(u => u.email === 'admin@eits.com')
  if (!admin) { console.error('Admin not found'); process.exit(1) }

  const { error } = await supabase.auth.admin.updateUserById(admin.id, {
    password: '12345678'
  })

  if (error) {
    console.error('Update error:', error.message)
    process.exit(1)
  }

  console.log('✅ Password admin berhasil diubah ke: 12345678')
}

run()
