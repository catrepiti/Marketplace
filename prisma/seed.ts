import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@marketplacehub.com' },
    update: { role: 'ADMIN' },
    create: { name: 'Administrador', email: 'admin@marketplacehub.com', password: adminPassword, role: 'ADMIN' },
  })

  const features = JSON.stringify([
    'Dashboard financeiro completo',
    'Score de atividade da conta',
    'Monitoramento de reputação',
    'Precificador automático',
    'Análise de concorrentes',
    'DRE — Resultado financeiro',
    'Até 3 contas de marketplace',
    'Dados de vendas e avaliações',
    'Suporte dedicado',
    'Atualizações sem custo adicional',
  ])

  const plans = [
    {
      name: 'Mensal',
      price: 97.90,
      interval: 'mensal',
      maxAccounts: 3,
      sortOrder: 1,
      features,
    },
    {
      name: 'Anual',
      price: 59.90,
      interval: 'anual',
      maxAccounts: 3,
      sortOrder: 2,
      features,
    },
  ]

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } })
    if (existing) {
      await prisma.plan.update({ where: { id: existing.id }, data: plan })
    } else {
      await prisma.plan.create({ data: { ...plan, active: true } })
    }
  }

  await prisma.plan.updateMany({
    where: { name: { notIn: ['Mensal', 'Anual'] } },
    data: { active: false },
  })

  console.log('✅ Seed concluído')
  console.log('   admin@marketplacehub.com / admin123')
  console.log('   2 planos: Mensal R$97,90/mês | Anual R$59,90/mês')
}

main().catch(console.error).finally(() => prisma.$disconnect())
