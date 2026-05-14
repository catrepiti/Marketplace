import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardMetrics } from '@/lib/types'

export const dynamic = 'force-dynamic'

function zeroDashboard(marketplaces: string[]): DashboardMetrics {
  const today = new Date()
  const salesByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (29 - i))
    return {
      date:  d.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d),
      total: 0,
    } as { date: string; total: number } & Record<string, number | string>
  })
  return {
    totalRevenue: 0, totalOrders: 0,
    averageTicket: 0, averageRating: 0, cancelRate: 0,
    prevPeriod: { totalRevenue: 0, totalOrders: 0, averageRating: 0, cancelRate: 0, averageTicket: 0 },
    salesByDay,
    byMarketplace: marketplaces.map(mp => ({
      marketplace: mp as any,
      revenue: 0, orders: 0, averageRating: 0,
    })),
    topProducts: [],
    recentOrders: [],
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (clientId) {
    const dbClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, marketplaceAccounts: { select: { marketplace: true } } },
    })
    if (!dbClient) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    return NextResponse.json(zeroDashboard(dbClient.marketplaceAccounts.map(a => a.marketplace)))
  }

  return NextResponse.json(zeroDashboard([]))
}
