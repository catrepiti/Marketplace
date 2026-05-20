import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardMetrics } from '@/lib/types'
import { getMlToken, getMlSellerId } from '@/lib/integrations/getToken'
import { mlGetOrders, mlGetFeedbacks } from '@/lib/integrations/mercadolivre'

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
    byMarketplace: marketplaces.map(mp => ({ marketplace: mp as any, revenue: 0, orders: 0, averageRating: 0 })),
    topProducts: [],
    recentOrders: [],
  }
}

async function realDashboard(clientId: string, marketplaces: string[], period: number): Promise<DashboardMetrics> {
  const token    = await getMlToken(clientId)
  const sellerId = await getMlSellerId(clientId)

  if (!token || !sellerId) return zeroDashboard(marketplaces)

  try {
    const [orders, feedbacks] = await Promise.all([
      mlGetOrders(sellerId, token, period * 2),
      mlGetFeedbacks(sellerId, token),
    ])

    const cutoff     = new Date(Date.now() -  period        * 86400000)
    const prevCutoff = new Date(Date.now() - (period * 2)   * 86400000)

    const currOrders = orders.filter(o => new Date(o.date_created) >= cutoff && ['paid','delivered','closed'].includes(o.status))
    const prevOrders = orders.filter(o => { const d = new Date(o.date_created); return d >= prevCutoff && d < cutoff && ['paid','delivered','closed'].includes(o.status) })

    const totalRevenue  = +currOrders.reduce((s, o) => s + o.total_amount, 0).toFixed(2)
    const prevRevenue   = +prevOrders.reduce((s, o) => s + o.total_amount, 0).toFixed(2)
    const averageTicket = currOrders.length > 0 ? +(totalRevenue / currOrders.length).toFixed(2) : 0
    const prevAvgTicket = prevOrders.length > 0 ? +(prevRevenue  / prevOrders.length).toFixed(2) : 0

    const ratings = feedbacks.map(f => f.rating_value === 'positive' ? 5 : f.rating_value === 'neutral' ? 3 : 1)
    const averageRating = ratings.length > 0 ? +(ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : 0

    // Sales by day
    const today = new Date()
    const salesByDay = Array.from({ length: period }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (period - 1 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const dayRevenue = currOrders
        .filter(o => o.date_created?.slice(0, 10) === dateStr)
        .reduce((s, o) => s + o.total_amount, 0)
      return {
        date: dateStr,
        label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d),
        total: +dayRevenue.toFixed(2),
        mercadolivre: +dayRevenue.toFixed(2),
      } as { date: string; total: number } & Record<string, number | string>
    })

    // Top products
    const productMap: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {}
    for (const o of currOrders) {
      for (const item of o.order_items) {
        const key = item.item.id
        if (!productMap[key]) productMap[key] = { name: item.item.title, sku: item.item.id, qty: 0, revenue: 0 }
        productMap[key].qty     += item.quantity
        productMap[key].revenue += item.unit_price * item.quantity
      }
    }
    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([, v]) => ({ product: v.name, sku: v.sku, quantity: v.qty, revenue: +v.revenue.toFixed(2), marketplace: 'MERCADOLIVRE' as any }))

    // Recent orders
    const recentOrders = currOrders.slice(0, 10).map(o => ({
      id: String(o.id),
      marketplace: 'MERCADOLIVRE' as any,
      externalId: String(o.id),
      customer: o.buyer?.nickname ?? 'Cliente',
      product: o.order_items[0]?.item?.title ?? 'Produto',
      sku: o.order_items[0]?.item?.id ?? '',
      quantity: o.order_items[0]?.quantity ?? 1,
      unitPrice: o.order_items[0]?.unit_price ?? 0,
      totalPrice: o.total_amount,
      status: o.status === 'paid' ? 'paid' : o.status === 'delivered' ? 'delivered' : 'confirmed' as any,
      createdAt: o.date_created,
      updatedAt: o.date_created,
      shippingDeadline: o.date_created,
    }))

    return {
      totalRevenue,
      totalOrders: currOrders.length,
      averageTicket,
      averageRating,
      cancelRate: 0,
      prevPeriod: {
        totalRevenue: prevRevenue,
        totalOrders:  prevOrders.length,
        averageRating,
        cancelRate: 0,
        averageTicket: prevAvgTicket,
      },
      salesByDay,
      byMarketplace: [{ marketplace: 'MERCADOLIVRE' as any, revenue: totalRevenue, orders: currOrders.length, averageRating }],
      topProducts,
      recentOrders,
    }
  } catch (err) {
    console.error('ML dashboard error:', err)
    return zeroDashboard(marketplaces)
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const period   = parseInt(searchParams.get('period') ?? '30')

  if (clientId) {
    const dbClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, marketplaceAccounts: { select: { marketplace: true } } },
    })
    if (!dbClient) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    const mps = dbClient.marketplaceAccounts.map(a => a.marketplace)
    return NextResponse.json(await realDashboard(clientId, mps, period))
  }

  return NextResponse.json(zeroDashboard([]))
}
