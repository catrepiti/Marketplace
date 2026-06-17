import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { client: { select: { id: true, plan: { select: { maxAccounts: true } }, marketplaceAccounts: { select: { id: true } } } } },
  })

  if (!user?.client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const currentCount = user.client.marketplaceAccounts.length
  const maxAccounts = user.client.plan?.maxAccounts ?? 3
  if (currentCount >= maxAccounts) {
    return NextResponse.json({ error: `Limite de ${maxAccounts} contas atingido` }, { status: 400 })
  }

  const body = await request.json()
  const { marketplace, accountName, sellerId } = body

  if (!marketplace || !accountName) {
    return NextResponse.json({ error: 'Marketplace e nome da conta são obrigatórios' }, { status: 400 })
  }

  const valid = ['MERCADOLIVRE', 'SHOPEE', 'AMAZON']
  if (!valid.includes(marketplace)) {
    return NextResponse.json({ error: 'Marketplace inválido' }, { status: 400 })
  }

  const existing = await prisma.marketplaceAccount.findUnique({
    where: { clientId_marketplace: { clientId: user.client.id, marketplace } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Já existe uma conta para este marketplace' }, { status: 409 })
  }

  const account = await prisma.marketplaceAccount.create({
    data: {
      clientId: user.client.id,
      marketplace,
      accountName: accountName.trim(),
      sellerId: sellerId?.trim() || null,
    },
    select: { id: true, marketplace: true, accountName: true, status: true, createdAt: true },
  })

  return NextResponse.json(account, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('id')
  if (!accountId) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { client: { select: { id: true } } },
  })
  if (!user?.client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const account = await prisma.marketplaceAccount.findFirst({
    where: { id: accountId, clientId: user.client.id },
  })
  if (!account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })

  await prisma.marketplaceAccount.delete({ where: { id: accountId } })

  return NextResponse.json({ ok: true })
}
