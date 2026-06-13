import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '100')

  const where: any = {}
  if (clientId) where.clientId = clientId

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      take: limit,
      include: { client: { select: { name: true } } },
    }),
    prisma.sale.count({ where }),
  ])

  return NextResponse.json({ sales, total })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await req.json()

  if (Array.isArray(body)) {
    const results = []
    for (const item of body) {
      const sale = await createSale(item)
      if ('error' in sale) return NextResponse.json(sale, { status: 400 })
      results.push(sale)
    }
    return NextResponse.json({ imported: results.length, sales: results }, { status: 201 })
  }

  const sale = await createSale(body)
  if ('error' in sale) return NextResponse.json(sale, { status: 400 })
  return NextResponse.json(sale, { status: 201 })
}

async function createSale(data: any): Promise<{ error: string } | Record<string, any>> {
  const { clientId, marketplace, product, customer, quantity, unitPrice, totalPrice, status, saleDate, externalId } = data

  if (!clientId || !marketplace || !product || unitPrice == null)
    return { error: 'clientId, marketplace, product e unitPrice são obrigatórios' }

  const qty = quantity ?? 1
  const total = totalPrice ?? qty * Number(unitPrice)

  return prisma.sale.create({
    data: {
      clientId,
      marketplace: marketplace.toUpperCase(),
      product,
      customer: customer ?? null,
      quantity: qty,
      unitPrice: Number(unitPrice),
      totalPrice: total,
      status: status ?? 'paid',
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      externalId: externalId ?? null,
    },
  })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id, clientId } = await req.json()

  if (id) {
    await prisma.sale.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  if (clientId) {
    const { count } = await prisma.sale.deleteMany({ where: { clientId } })
    return NextResponse.json({ ok: true, deleted: count })
  }

  return NextResponse.json({ error: 'Informe id ou clientId' }, { status: 400 })
}
