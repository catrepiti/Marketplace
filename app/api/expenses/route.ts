import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getClientId(session: any) {
  const role = session.user?.role
  const userId = session.user?.id

  if (role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clientId: true } })
    return user?.clientId
  }

  return null
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId') || await getClientId(session)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  const where: any = { clientId }
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to + 'T23:59:59.999Z')
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(expenses)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const role = (session.user as any)?.role

  let clientId = body.clientId
  if (role === 'CLIENT') {
    clientId = await getClientId(session)
  }

  if (!clientId || !body.category || !body.description || body.amount == null) {
    return NextResponse.json({ error: 'Campos obrigatórios: clientId, category, description, amount' }, { status: 400 })
  }

  const expense = await prisma.expense.create({
    data: {
      clientId,
      category: body.category,
      description: body.description,
      amount: Number(body.amount),
      date: body.date ? new Date(body.date) : new Date(),
    },
  })

  return NextResponse.json(expense, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
