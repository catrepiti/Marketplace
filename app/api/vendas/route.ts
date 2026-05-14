import { NextResponse } from 'next/server'
import { getOrders } from '@/lib/mock/store'
import { Marketplace, OrderStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const marketplace = searchParams.get('marketplace') as Marketplace | null
  const status = searchParams.get('status') as OrderStatus | null
  const search = searchParams.get('search')?.toLowerCase()
  const period = parseInt(searchParams.get('period') || '30')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')

  const allOrders = getOrders()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - period)

  const prevCutoff = new Date()
  prevCutoff.setDate(prevCutoff.getDate() - period * 2)

  let orders = allOrders.filter(o => new Date(o.createdAt) >= cutoff)

  if (marketplace) orders = orders.filter(o => o.marketplace === marketplace)
  if (status) orders = orders.filter(o => o.status === status)
  if (search) orders = orders.filter(o =>
    o.customer.toLowerCase().includes(search) ||
    o.product.toLowerCase().includes(search) ||
    o.externalId.toLowerCase().includes(search) ||
    o.id.toLowerCase().includes(search)
  )

  const total = orders.length
  const start = (page - 1) * limit
  const data = orders.slice(start, start + limit)

  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned')
  const summary = {
    totalOrders: orders.length,
    totalRevenue: +activeOrders.reduce((s, o) => s + o.totalPrice, 0).toFixed(2),
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    returned: orders.filter(o => o.status === 'returned').length,
  }

  // Previous period (no text/marketplace/status filters — compare same base)
  const prevOrders = allOrders.filter(o => {
    const d = new Date(o.createdAt)
    return d >= prevCutoff && d < cutoff
  })
  const prevActive = prevOrders.filter(o => o.status !== 'cancelled' && o.status !== 'returned')
  const prevSummary = {
    totalOrders: prevOrders.length,
    totalRevenue: +prevActive.reduce((s, o) => s + o.totalPrice, 0).toFixed(2),
    cancelled: prevOrders.filter(o => o.status === 'cancelled').length,
    returned: prevOrders.filter(o => o.status === 'returned').length,
  }

  // Daily sales for mini chart (current period only)
  const dayMap: Record<string, { revenue: number; orders: number }> = {}
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayMap[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 }
  }
  for (const o of allOrders.filter(o => new Date(o.createdAt) >= cutoff)) {
    if (o.status === 'cancelled' || o.status === 'returned') continue
    const key = o.createdAt.split('T')[0]
    if (dayMap[key]) {
      dayMap[key].revenue += o.totalPrice
      dayMap[key].orders += 1
    }
  }
  const salesByDay = Object.entries(dayMap).map(([date, v]) => ({
    date,
    revenue: +v.revenue.toFixed(2),
    orders: v.orders,
  }))

  return NextResponse.json({ data, total, page, limit, summary, prevSummary, salesByDay })
}
