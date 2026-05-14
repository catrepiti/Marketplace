import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await request.json()
  const { marketplace, accountName, sellerId, appId, appSecret, accessToken, refreshToken, status } = body

  if (!marketplace) return NextResponse.json({ error: 'marketplace obrigatório' }, { status: 400 })

  const account = await prisma.marketplaceAccount.upsert({
    where: { clientId_marketplace: { clientId: params.id, marketplace } },
    update: { accountName, sellerId, appId, appSecret, accessToken, refreshToken, status },
    create: { clientId: params.id, marketplace, accountName: accountName || marketplace, sellerId, appId, appSecret, accessToken, refreshToken, status: status || 'active' },
  })

  return NextResponse.json(account)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const marketplace = searchParams.get('marketplace')
  if (!marketplace) return NextResponse.json({ error: 'marketplace obrigatório' }, { status: 400 })

  await prisma.marketplaceAccount.deleteMany({ where: { clientId: params.id, marketplace } })
  return NextResponse.json({ ok: true })
}
