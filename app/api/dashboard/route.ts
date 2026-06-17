import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any)?.id
  const role = (session.user as any)?.role
  const { searchParams } = new URL(request.url)

  let clientId = searchParams.get('clientId')
  if (role === 'CLIENT' || !clientId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clientId: true } })
    clientId = user?.clientId ?? null
  }

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: any = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z')

  const salesWhere: any = {
    status: { in: ['paid', 'delivered', 'closed'] },
  }
  if (clientId) salesWhere.clientId = clientId
  if (from || to) salesWhere.saleDate = dateFilter

  const accountsWhere = clientId ? { clientId, status: 'active' } : { status: 'active' }
  const [sales, listingsCount] = await Promise.all([
    prisma.sale.findMany({ where: salesWhere, orderBy: { saleDate: 'desc' } }),
    prisma.marketplaceAccount.count({ where: accountsWhere }),
  ])

  const hasConnectedAccounts = listingsCount > 0

  const totalRevenue = sales.reduce((s, sale) => s + sale.totalPrice, 0)
  const totalOrders = sales.length
  const totalItems = sales.reduce((s, sale) => s + sale.quantity, 0)
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const salesByDayMap: Record<string, { revenue: number; orders: number }> = {}
  for (const sale of sales) {
    const day = sale.saleDate.toISOString().slice(0, 10)
    if (!salesByDayMap[day]) salesByDayMap[day] = { revenue: 0, orders: 0 }
    salesByDayMap[day].revenue += sale.totalPrice
    salesByDayMap[day].orders += 1
  }
  const salesByDay = Object.entries(salesByDayMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, ...data }))

  const salesByMarketplace: Record<string, number> = {}
  for (const sale of sales) {
    salesByMarketplace[sale.marketplace] = (salesByMarketplace[sale.marketplace] ?? 0) + sale.totalPrice
  }

  const productMap: Record<string, { name: string; revenue: number; quantity: number }> = {}
  for (const sale of sales) {
    if (!productMap[sale.product]) productMap[sale.product] = { name: sale.product, revenue: 0, quantity: 0 }
    productMap[sale.product].revenue += sale.totalPrice
    productMap[sale.product].quantity += sale.quantity
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const recentSales = sales.slice(0, 10).map(s => ({
    id: s.id,
    product: s.product,
    totalPrice: s.totalPrice,
    marketplace: s.marketplace,
    saleDate: s.saleDate,
    status: s.status,
  }))

  return NextResponse.json({
    hasConnectedAccounts,
    totalRevenue: +totalRevenue.toFixed(2),
    totalOrders,
    totalItems,
    avgTicket: +avgTicket.toFixed(2),
    activeListings: listingsCount,
    reputationScore: 75,
    salesByDay,
    salesByMarketplace,
    topProducts,
    recentSales,
  })
}
