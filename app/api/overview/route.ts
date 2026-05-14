import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateClientOverview } from '@/lib/mock/client-generator'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (!['ADMIN', 'TRAFFIC_MANAGER', 'PROJECT_MANAGER'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dbClients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      marketplaceAccounts: { select: { marketplace: true } },
    },
    orderBy: { name: 'asc' },
  })

  const clients = dbClients.map(c => {
    const activeMarketplaces = c.marketplaceAccounts.map(a => a.marketplace)
    return generateClientOverview(c.id, c.name, c.slug, activeMarketplaces)
  })

  const totals = {
    clients: clients.length,
    gmv: clients.reduce((s, c) => s + c.gmv, 0),
    orders: clients.reduce((s, c) => s + c.orders, 0),
    adSpend: clients.reduce((s, c) => s + c.adSpend, 0),
    products: clients.reduce((s, c) => s + c.products, 0),
    avgRoas: clients.length > 0 ? clients.reduce((s, c) => s + c.roas, 0) / clients.length : 0,
  }

  return NextResponse.json({ clients, totals })
}
