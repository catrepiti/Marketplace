import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { clients: true } } },
  })

  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await req.json()
  const { name, price, interval, features, maxAccounts, active, sortOrder } = body

  if (!name || price == null)
    return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 })

  const plan = await prisma.plan.create({
    data: {
      name,
      price: Number(price),
      interval: interval ?? 'monthly',
      features: JSON.stringify(features ?? []),
      maxAccounts: maxAccounts ?? 3,
      active: active ?? true,
      sortOrder: sortOrder ?? 0,
    },
  })

  return NextResponse.json(plan, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await req.json()
  const { id, ...data } = body

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  if (data.price != null) data.price = Number(data.price)
  if (data.maxAccounts != null) data.maxAccounts = Number(data.maxAccounts)
  if (data.features && Array.isArray(data.features)) data.features = JSON.stringify(data.features)

  const plan = await prisma.plan.update({ where: { id }, data })
  return NextResponse.json(plan)
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.client.updateMany({ where: { planId: id }, data: { planId: null } })
  await prisma.plan.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
