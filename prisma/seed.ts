import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Usuários do time interno ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@marketplacehub.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@marketplacehub.com', password: adminPassword, role: 'ADMIN' },
  })

  const trafficPassword = await bcrypt.hash('traffic123', 12)
  await prisma.user.upsert({
    where:  { email: 'trafego@marketplacehub.com' },
    update: {},
    create: { name: 'Gestor de Tráfego', email: 'trafego@marketplacehub.com', password: trafficPassword, role: 'TRAFFIC_MANAGER' },
  })

  const projectPassword = await bcrypt.hash('project123', 12)
  await prisma.user.upsert({
    where:  { email: 'projetos@marketplacehub.com' },
    update: {},
    create: { name: 'Gestor de Projetos', email: 'projetos@marketplacehub.com', password: projectPassword, role: 'PROJECT_MANAGER' },
  })

  console.log('✅ Seed concluído — apenas usuários internos criados.')
  console.log('   admin@marketplacehub.com   /  admin123')
  console.log('   trafego@marketplacehub.com /  traffic123')
  console.log('   projetos@marketplacehub.com / project123')
  console.log('')
  console.log('   Clientes reais serão cadastrados via /admin/clientes.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
