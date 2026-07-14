import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPreapproval, mpConfigured } from '@/lib/payments/mercadopago'

export const dynamic = 'force-dynamic'

/**
 * Cria uma assinatura no Mercado Pago para o cliente logado
 * e retorna a URL de checkout (init_point).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!mpConfigured()) {
    return NextResponse.json(
      { error: 'Pagamentos ainda não configurados. Adicione MP_ACCESS_TOKEN nas variáveis de ambiente.' },
      { status: 503 }
    )
  }

  const userId = (session.user as any)?.id
  const role = (session.user as any)?.role
  const email = session.user?.email
  if (!email) return NextResponse.json({ error: 'Usuário sem e-mail' }, { status: 400 })

  let planId: string | null = null
  let clientId: string | null = null
  try {
    const body = await request.json()
    planId = body?.planId ?? null
    clientId = body?.clientId ?? null
  } catch {}

  // CLIENT assina o próprio negócio; equipe pode gerar checkout para um cliente
  if (role === 'CLIENT' || !clientId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clientId: true } })
    clientId = user?.clientId ?? null
  }
  if (!clientId) return NextResponse.json({ error: 'Nenhum cliente vinculado à sua conta' }, { status: 400 })

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { plan: true },
  })
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  // Se veio um planId diferente, troca o plano antes de assinar
  let plan = client.plan
  if (planId && planId !== client.planId) {
    plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.active) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    await prisma.client.update({ where: { id: clientId }, data: { planId } })
  }
  if (!plan) return NextResponse.json({ error: 'Escolha um plano antes de assinar' }, { status: 400 })

  if (client.subscriptionStatus === 'active') {
    return NextResponse.json({ error: 'Este cliente já possui assinatura ativa' }, { status: 409 })
  }

  try {
    const preapproval = await createPreapproval({
      planName: plan.name,
      price: plan.price,
      interval: plan.interval,
      payerEmail: email,
      clientId,
    })

    await prisma.client.update({
      where: { id: clientId },
      data: {
        mpPreapprovalId: preapproval.id,
        subscriptionStatus: 'pending',
        subscriptionUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({ url: preapproval.initPoint })
  } catch (err) {
    console.error('[checkout] erro ao criar assinatura MP:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar assinatura' },
      { status: 502 }
    )
  }
}
