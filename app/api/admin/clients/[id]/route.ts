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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      marketplaceAccounts: true,
      documents: { orderBy: { createdAt: 'desc' } },
      plan: true,
    },
  })

  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await request.json()
  const { name, slug, planId } = body

  const data: any = {}
  if (name) data.name = name
  if (slug) data.slug = slug
  if (planId !== undefined) data.planId = planId || null

  const client = await prisma.client.update({
    where: { id: params.id },
    data,
    include: { plan: true },
  })
  return NextResponse.json(client)
}
