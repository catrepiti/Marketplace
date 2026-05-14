import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientOverview } from '@/lib/mock/client-generator'
import { MARKETPLACE_KEYS } from '@/lib/marketplaces'

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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['ADMIN', 'TRAFFIC_MANAGER', 'PROJECT_MANAGER'].includes(role)) {
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

  // Return real structure but zero metrics — no mock data until real API tokens exist
  const clients = dbClients.map(c => {
    const activeMarketplaces = c.marketplaceAccounts.map(a => a.marketplace)
    return zeroClient(c.id, c.name, c.slug, activeMarketplaces)
  })

  return NextResponse.json({
    clients,
    totals: EMPTY_TOTALS,
  })
}
