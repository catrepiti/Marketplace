import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const invite = await prisma.connectionInvite.findUnique({
    where: { token: params.token },
    include: { client: { select: { id: true, name: true, slug: true } } },
  })

  if (!invite) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  if (new Date() > invite.expiresAt) return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
  if (invite.usedAt) return NextResponse.json({ error: 'Link já utilizado' }, { status: 409 })

  return NextResponse.json({
    clientId: invite.clientId,
    clientName: invite.client.name,
    marketplace: invite.marketplace,
    expiresAt: invite.expiresAt,
  })
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const invite = await prisma.connectionInvite.findUnique({
    where: { token: params.token },
  })

  if (!invite) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  if (new Date() > invite.expiresAt) return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
  if (invite.usedAt) return NextResponse.json({ error: 'Link já utilizado' }, { status: 409 })

  const { accountName, sellerId, accessToken } = await request.json()

  if (!accountName || !sellerId || !accessToken) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 })
  }

  await prisma.marketplaceAccount.upsert({
    where: { clientId_marketplace: { clientId: invite.clientId, marketplace: invite.marketplace } },
    update: { accountName, sellerId, accessToken, status: 'active', updatedAt: new Date() },
    create: { clientId: invite.clientId, marketplace: invite.marketplace, accountName, sellerId, accessToken, status: 'active' },
  })

  await prisma.connectionInvite.update({
    where: { token: params.token },
    data: { usedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
