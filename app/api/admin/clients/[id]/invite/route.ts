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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { marketplace } = await request.json()
  if (!marketplace) return NextResponse.json({ error: 'marketplace obrigatório' }, { status: 400 })

  const client = await prisma.client.findUnique({ where: { id: params.id } })
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await prisma.connectionInvite.create({
    data: { clientId: params.id, marketplace, expiresAt },
  })

  return NextResponse.json({ token: invite.token, expiresAt: invite.expiresAt })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const invites = await prisma.connectionInvite.findMany({
    where: { clientId: params.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(invites)
}
