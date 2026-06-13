import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Usuários do time ──────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@marketplacehub.com' },
    update: { role: 'ADMIN' },
    create: { name: 'Administrador', email: 'admin@marketplacehub.com', password: adminPassword, role: 'ADMIN' },
  })

  // ── Planos SaaS ───────────────────────────────────────────────────────────
  const plans = [
    {
      name: 'Starter',
      price: 197,
      interval: 'monthly',
      maxAccounts: 1,
      sortOrder: 1,
      features: JSON.stringify([
        '1 marketplace integrado',
        'Dashboard em tempo real',
        'Relatório de vendas',
        'Avaliações e feedbacks',
        'Suporte por e-mail',
      ]),
    },
    {
      name: 'Professional',
      price: 497,
      interval: 'monthly',
      maxAccounts: 3,
      sortOrder: 2,
      features: JSON.stringify([
        'Até 3 marketplaces integrados',
        'Dashboard em tempo real',
        'Relatório completo de vendas',
        'Gestão de anúncios',
        'Avaliações e feedbacks',
        'Importação de dados CSV',
        'Assessoria com acesso dedicado',
        'Suporte prioritário',
      ]),
    },
    {
      name: 'Business',
      price: 997,
      interval: 'monthly',
      maxAccounts: 10,
      sortOrder: 3,
      features: JSON.stringify([
        'Marketplaces ilimitados',
        'Dashboard em tempo real',
        'Relatórios avançados e exportação',
        'Gestão completa de anúncios',
        'Avaliações e feedbacks',
        'Importação de dados CSV e API',
        'Multi-usuários por conta',
        'Assessoria com acesso total',
        'Suporte prioritário via WhatsApp',
        'Onboarding personalizado',
      ]),
    },
    {
      name: 'Enterprise',
      price: 2497,
      interval: 'monthly',
      maxAccounts: 999,
      sortOrder: 4,
      features: JSON.stringify([
        'Tudo do plano Business',
        'Operações ilimitadas',
        'API de integração dedicada',
        'SLA garantido 99.9%',
        'Gerente de conta exclusivo',
        'Customizações sob demanda',
        'Treinamento para equipe',
        'Relatórios white-label',
      ]),
    },
  ]

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } })
    if (!existing) {
      await prisma.plan.create({ data: { ...plan, active: true } })
    }
  }

  console.log('✅ Seed concluído')
  console.log('   admin@marketplacehub.com / admin123')
  console.log('   4 planos SaaS criados: Starter, Professional, Business, Enterprise')
}

main().catch(console.error).finally(() => prisma.$disconnect())
