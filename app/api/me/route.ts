import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          plan: { select: { id: true, name: true, price: true, interval: true, features: true, maxAccounts: true } },
          marketplaceAccounts: {
            select: { marketplace: true, accountName: true, status: true, accessToken: true, sellerId: true, createdAt: true },
          },
          _count: { select: { sales: true, users: true, documents: true } },
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const result: any = { ...user }

  if (user.client) {
    result.client = {
      ...user.client,
      marketplaceAccounts: user.client.marketplaceAccounts.map(a => ({
        marketplace: a.marketplace,
        accountName: a.accountName,
        status: a.status,
        connected: !!a.accessToken,
        hasSellerId: !!a.sellerId,
        createdAt: a.createdAt,
      })),
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const [salesStats, recentSales] = await Promise.all([
      prisma.sale.aggregate({
        where: { clientId: user.client.id, saleDate: { gte: thirtyDaysAgo } },
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.sale.findMany({
        where: { clientId: user.client.id },
        orderBy: { saleDate: 'desc' },
        take: 5,
        select: { id: true, product: true, totalPrice: true, marketplace: true, saleDate: true, status: true },
      }),
    ])

    result.stats = {
      totalSales30d: salesStats._count ?? 0,
      revenue30d: salesStats._sum.totalPrice ?? 0,
      totalSalesAll: user.client._count.sales,
      totalUsers: user.client._count.users,
      totalDocuments: user.client._count.documents,
    }
    result.recentSales = recentSales
  }

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await request.json()
  const { name } = body

  const data: any = {}
  if (name !== undefined) data.name = name

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: 'Nenhum dado para atualizar' }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json(user)
}
