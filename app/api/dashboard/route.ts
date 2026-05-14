import { NextResponse } from 'next/server'
import { getOrders, getFeedbacks } from '@/lib/mock/store'
import { generateSalesByDay } from '@/lib/mock/generator'
import { generateClientOverview } from '@/lib/mock/client-generator'
import { prisma } from '@/lib/prisma'
import { DashboardMetrics, Marketplace } from '@/lib/types'
import { MARKETPLACE_KEYS } from '@/lib/marketplaces'

export const dynamic = 'force-dynamic'

// ── Client-specific dashboard derived from generateClientOverview ──────────────
async function buildClientMetrics(clientId: string, period: number): Promise<DashboardMetrics | null> {
  const dbClient = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, slug: true, marketplaceAccounts: { select: { marketplace: true } } },
  })
  if (!dbClient) return null

  const mps = dbClient.marketplaceAccounts.map(a => a.marketplace)
  const ov  = generateClientOverview(dbClient.id, dbClient.name, dbClient.slug, mps)

  // Use last `period` days of revenueByDay
  const days = ov.revenueByDay.slice(-period)
  const prevDays = ov.revenueByDay.slice(0, Math.max(0, ov.revenueByDay.length - period))

  // Build salesByDay with per-marketplace split from byMarketplace weights
  const mpWeights = Object.fromEntries(
    ov.byMarketplace.map(mp => [mp.marketplace, ov.gmv > 0 ? mp.revenue / ov.gmv : 0])
  )
  const salesByDay = days.map(d => {
    const entry: Record<string, number | string> = { date: d.date, total: +d.revenue.toFixed(2) }
    ov.byMarketplace.forEach(mp => {
      entry[mp.marketplace] = +((d.revenue * (mpWeights[mp.marketplace] ?? 0))).toFixed(2)
    })
    return entry as { date: string; total: number } & Record<string, number | string>
  })

  const prevRevenue = prevDays.reduce((s, d) => s + d.revenue, 0)
  const prevRatio   = ov.gmv > 0 ? prevRevenue / ov.gmv : 0

  const byMarketplace = ov.byMarketplace.map(mp => ({
    marketplace: mp.marketplace as Marketplace,
    revenue: mp.revenue,
    orders: mp.orders,
    averageRating: mp.avgRating,
  }))

  // Fake recent orders per marketplace
  const recentOrders = ov.byMarketplace.flatMap((mp, mi) =>
    Array.from({ length: Math.min(3, Math.round(mp.orders / 10) || 1) }, (_, i) => ({
      id: `#${dbClient.slug.toUpperCase().slice(0, 3)}-${mi * 10 + i + 1001}`,
      marketplace: mp.marketplace as Marketplace,
      customer: ['Lucas Mendes', 'Ana Silva', 'Carlos Ferreira', 'Maria Santos'][((mi * 3 + i) % 4)],
      product: ov.topProducts[i % ov.topProducts.length]?.name ?? 'Produto',
      sku: `SKU-${(mi * 10 + i).toString().padStart(4, '0')}`,
      quantity: 1,
      totalPrice: +(ov.avgTicket * (0.8 + Math.random() * 0.4)).toFixed(2),
      status: (['paid', 'processing', 'shipped', 'delivered'] as const)[(mi + i) % 4],
      createdAt: new Date(Date.now() - (mi * 3 + i) * 3_600_000 * 4).toISOString(),
    }))
  ).slice(0, 8)

  const metrics: DashboardMetrics = {
    totalRevenue: +ov.gmv.toFixed(2),
    totalOrders:  ov.orders,
    averageTicket: +ov.avgTicket.toFixed(2),
    averageRating: +ov.avgRating.toFixed(1),
    cancelRate:   +ov.cancelRate.toFixed(1),
    prevPeriod: {
      totalRevenue: +(ov.gmv * prevRatio * (0.9 + Math.random() * 0.2)).toFixed(2),
      totalOrders:  Math.round(ov.orders * prevRatio),
      averageTicket: +ov.avgTicket.toFixed(2),
      averageRating: +(ov.avgRating - 0.1 + Math.random() * 0.2).toFixed(1),
      cancelRate:   +(ov.cancelRate + Math.random() * 1 - 0.5).toFixed(1),
    },
    byMarketplace,
    salesByDay,
    topProducts: ov.topProducts.map((p, i) => ({
      product: p.name,
      sku: `SKU-${dbClient.slug.toUpperCase().slice(0, 3)}-${i + 1}`,
      quantity: Math.round(ov.orders * (0.05 + Math.random() * 0.1)),
      revenue: p.revenue,
      marketplace: p.marketplace,
    })),
    recentOrders: recentOrders as DashboardMetrics['recentOrders'],
  }
  return metrics
}

function calcMetrics(orders: ReturnType<typeof getOrders>, feedbacks: ReturnType<typeof getFeedbacks>, cutoff: Date) {
  const periodOrders = orders.filter(o => new Date(o.createdAt) >= cutoff)
  const activeOrders = periodOrders.filter(o => o.status !== 'cancelled' && o.status !== 'returned')
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalPrice, 0)
  const totalOrders = activeOrders.length
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const periodFeedbacks = feedbacks.filter(f => new Date(f.createdAt) >= cutoff)
  const averageRating = periodFeedbacks.length > 0
    ? periodFeedbacks.reduce((s, f) => s + f.rating, 0) / periodFeedbacks.length
    : 0
  const cancelled = periodOrders.filter(o => o.status === 'cancelled').length
  const cancelRate = periodOrders.length > 0 ? (cancelled / periodOrders.length) * 100 : 0
  return { totalRevenue, totalOrders, averageTicket, averageRating, cancelRate }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period   = parseInt(searchParams.get('period') || '30')
  const clientId = searchParams.get('clientId')

  // ── Per-client mode ───────────────────────────────────────────────────────────
  if (clientId) {
    const metrics = await buildClientMetrics(clientId, period)
    if (!metrics) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json(metrics)
  }

  const allOrders = getOrders()
  const feedbacks = getFeedbacks()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - period)

  const prevCutoff = new Date()
  prevCutoff.setDate(prevCutoff.getDate() - period * 2)
  const prevEnd = new Date(cutoff)

  const prevOrders = allOrders.filter(o => {
    const d = new Date(o.createdAt)
    return d >= prevCutoff && d < prevEnd
  })
  const prevFeedbacks = feedbacks.filter(f => {
    const d = new Date(f.createdAt)
    return d >= prevCutoff && d < prevEnd
  })

  const current = calcMetrics(allOrders, feedbacks, cutoff)
  const prev = calcMetrics(
    [...allOrders.filter(o => new Date(o.createdAt) < prevEnd), ...prevOrders],
    [...feedbacks.filter(f => new Date(f.createdAt) < prevEnd), ...prevFeedbacks],
    prevCutoff
  )

  const orders = allOrders.filter(o => new Date(o.createdAt) >= cutoff)
  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned')
  const recentFeedbacks = feedbacks.filter(f => new Date(f.createdAt) >= cutoff)

  // Dynamic per-marketplace breakdown
  const byMarketplace = MARKETPLACE_KEYS.map(mp => {
    const mpOrders    = activeOrders.filter(o => o.marketplace === mp)
    const mpFeedbacks = recentFeedbacks.filter(f => f.marketplace === mp)
    return {
      marketplace: mp,
      revenue: +mpOrders.reduce((s, o) => s + o.totalPrice, 0).toFixed(2),
      orders: mpOrders.length,
      averageRating: mpFeedbacks.length > 0
        ? +(mpFeedbacks.reduce((s, f) => s + f.rating, 0) / mpFeedbacks.length).toFixed(1)
        : 0,
    }
  }).filter(mp => mp.orders > 0 || mp.revenue > 0)

  const allSalesByDay = generateSalesByDay(allOrders)
  const salesByDay = allSalesByDay.slice(-period)

  const productMap = new Map<string, { product: string; sku: string; quantity: number; revenue: number; marketplace: typeof MARKETPLACE_KEYS[number] }>()
  for (const o of activeOrders) {
    const existing = productMap.get(o.sku)
    if (existing) {
      existing.quantity += o.quantity
      existing.revenue += o.totalPrice
    } else {
      productMap.set(o.sku, { product: o.product, sku: o.sku, quantity: o.quantity, revenue: o.totalPrice, marketplace: o.marketplace })
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const metrics: DashboardMetrics = {
    totalRevenue: +current.totalRevenue.toFixed(2),
    totalOrders: current.totalOrders,
    averageTicket: +current.averageTicket.toFixed(2),
    averageRating: +current.averageRating.toFixed(1),
    cancelRate: +current.cancelRate.toFixed(1),
    prevPeriod: {
      totalRevenue: +prev.totalRevenue.toFixed(2),
      totalOrders: prev.totalOrders,
      averageTicket: +prev.averageTicket.toFixed(2),
      averageRating: +prev.averageRating.toFixed(1),
      cancelRate: +prev.cancelRate.toFixed(1),
    },
    byMarketplace,
    salesByDay,
    topProducts,
    recentOrders: allOrders.slice(0, 8),
  }

  return NextResponse.json(metrics)
}
