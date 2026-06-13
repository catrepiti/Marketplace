import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientOverview } from '@/lib/mock/client-generator'
import { MARKETPLACE_KEYS } from '@/lib/marketplaces'
import { getMlToken, getMlSellerId } from '@/lib/integrations/getToken'
import { mlGetOrders, mlGetFeedbacks } from '@/lib/integrations/mercadolivre'

export const dynamic = 'force-dynamic'

const EMPTY_TOTALS = { clients: 0, gmv: 0, orders: 0, adSpend: 0, products: 0, avgRoas: 0 }

function zeroClient(id: string, name: string, slug: string, activeMarketplaces: string[]): ClientOverview {
  const today = new Date()
  const revenueByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (29 - i))
    return { date: d.toISOString().slice(0, 10), revenue: 0 }
  })
  return {
    id, name, slug,
    gmv: 0, orders: 0, products: 0, adSpend: 0,
    roas: 0, avgRating: 0, avgTicket: 0, cancelRate: 0,
    trend: 0, adTrend: 0,
    activeMarketplaces: activeMarketplaces as any,
    topMarketplace: (activeMarketplaces[0] ?? MARKETPLACE_KEYS[0]) as any,
    byMarketplace: activeMarketplaces.map(mp => ({
      marketplace: mp as any,
      revenue: 0, orders: 0, products: 0, adSpend: 0, roas: 0, avgRating: 0,
    })),
    revenueByDay,
    topProducts: [],
  }
}

async function buildClientOverview(
  id: string, name: string, slug: string, activeMarketplaces: string[]
): Promise<ClientOverview> {
  const token    = await getMlToken(id)
  const sellerId = await getMlSellerId(id)

  if (!token || !sellerId) return zeroClient(id, name, slug, activeMarketplaces)

  try {
    const [orders, feedbacks] = await Promise.all([
      mlGetOrders(sellerId, token, 30),
      mlGetFeedbacks(sellerId, token),
    ])

    const paidOrders = orders.filter(o => ['paid', 'delivered', 'closed'].includes(o.status))
    const gmv = +paidOrders.reduce((s, o) => s + o.total_amount, 0).toFixed(2)
    const avgTicket = paidOrders.length > 0 ? +(gmv / paidOrders.length).toFixed(2) : 0

    // Revenue by day (last 30 days)
    const today = new Date()
    const revenueByDay = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().slice(0, 10)
      const dayRevenue = paidOrders
        .filter(o => o.date_created?.slice(0, 10) === dateStr)
        .reduce((s, o) => s + o.total_amount, 0)
      return { date: dateStr, revenue: +dayRevenue.toFixed(2) }
    })

    // 30d vs prev 30d trend
    const prev30 = orders.filter(o => {
      const created = new Date(o.date_created)
      const cutoff60 = new Date(Date.now() - 60 * 86400000)
      const cutoff30 = new Date(Date.now() - 30 * 86400000)
      return created >= cutoff60 && created < cutoff30 && ['paid', 'delivered', 'closed'].includes(o.status)
    })
    const prevGmv = prev30.reduce((s, o) => s + o.total_amount, 0)
    const trend = prevGmv > 0 ? +((((gmv - prevGmv) / prevGmv) * 100)).toFixed(1) : 0

    // Feedback
    const ratings = feedbacks.map(f => f.rating_value === 'positive' ? 5 : f.rating_value === 'neutral' ? 3 : 1)
    const avgRating = ratings.length > 0 ? +(ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : 0

    // Top products
    const productMap: Record<string, { name: string; revenue: number }> = {}
    for (const o of paidOrders) {
      for (const item of o.order_items) {
        const key = item.item.id
        if (!productMap[key]) productMap[key] = { name: item.item.title, revenue: 0 }
        productMap[key].revenue += item.unit_price * item.quantity
      }
    }
    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([, v]) => ({ name: v.name, revenue: +v.revenue.toFixed(2), marketplace: 'mercadolivre' as any }))

    return {
      id, name, slug,
      gmv, orders: paidOrders.length, products: topProducts.length,
      adSpend: 0, roas: 0,
      avgRating, avgTicket,
      cancelRate: 0, trend, adTrend: 0,
      activeMarketplaces: activeMarketplaces as any,
      topMarketplace: 'mercadolivre' as any,
      byMarketplace: [{ marketplace: 'mercadolivre' as any, revenue: gmv, orders: paidOrders.length, products: topProducts.length, adSpend: 0, roas: 0, avgRating }],
      revenueByDay,
      topProducts,
    }
  } catch (err) {
    console.error(`ML overview error for client ${id}:`, err)
    return zeroClient(id, name, slug, activeMarketplaces)
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['ADMIN', 'ASSESSOR'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dbClients = await prisma.client.findMany({
    select: {
      id: true, name: true, slug: true,
      marketplaceAccounts: { select: { marketplace: true, accessToken: true } },
    },
    orderBy: { name: 'asc' },
  })

  if (dbClients.length === 0) {
    return NextResponse.json({ clients: [], totals: EMPTY_TOTALS })
  }

  const clients = await Promise.all(
    dbClients.map(c => buildClientOverview(
      c.id, c.name, c.slug,
      c.marketplaceAccounts.map(a => a.marketplace)
    ))
  )

  const totals = {
    clients: clients.length,
    gmv:     +clients.reduce((s, c) => s + c.gmv, 0).toFixed(2),
    orders:   clients.reduce((s, c) => s + c.orders, 0),
    adSpend: +clients.reduce((s, c) => s + c.adSpend, 0).toFixed(2),
    products: clients.reduce((s, c) => s + c.products, 0),
    avgRoas:  clients.length > 0 ? +(clients.reduce((s, c) => s + c.roas, 0) / clients.length).toFixed(2) : 0,
  }

  return NextResponse.json({ clients, totals })
}
