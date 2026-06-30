import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('Seeding initial admin user...')
  
  const adminEmail = 'admin@eits.com'
  
  // Generate random password
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const adminPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

  // Check existing users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  if (!listError && users?.users) {
    const existing = users.users.find(u => u.email === adminEmail)
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id)
      await prisma.user.deleteMany({ where: { email: adminEmail } })
    }
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    console.error('Error creating user in Supabase:', authError)
    process.exit(1)
  }

  // Create user in Prisma DB
  const user = await prisma.user.create({
    data: {
      authId: authData.user.id,
      name: 'Administrator',
      email: adminEmail,
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Admin user created successfully!')
  console.log('-------------------------------------------')
  console.log(`Email:    ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
  console.log('-------------------------------------------')
  console.log('Harap simpan password ini dengan baik!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
