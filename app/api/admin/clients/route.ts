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

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { users: true } },
      marketplaceAccounts: { select: { marketplace: true, accountName: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await request.json()
  const { name, slug } = body

  if (!name || !slug) return NextResponse.json({ error: 'Nome e slug obrigatórios' }, { status: 400 })

  const existing = await prisma.client.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug já existe' }, { status: 400 })

  const client = await prisma.client.create({ data: { name, slug } })
  return NextResponse.json(client, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  await prisma.client.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
