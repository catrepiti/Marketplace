import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getInventory, getInventoryStats, updateStock, StockStatus } from '@/lib/mock/inventory-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasData = await prisma.marketplaceAccount.count({ where: { accessToken: { not: null } } }) > 0
  if (!hasData) {
    return NextResponse.json({
      items: [],
      stats: {
        total: 0, healthy: 0, low: 0, critical: 0, outOfStock: 0, overStock: 0,
        totalValue: 0, totalUnits: 0,
      },
    })
  }

  const { searchParams } = new URL(req.url)
  const marketplace = searchParams.get('marketplace') ?? ''
  const category    = searchParams.get('category') ?? ''
  const status      = searchParams.get('status') as StockStatus | null
  const search      = searchParams.get('search') ?? ''

  const items = getInventory({
    marketplace: marketplace || undefined,
    category:    category    || undefined,
    status:      status      || undefined,
    search:      search      || undefined,
  })
  const stats = getInventoryStats()

  return NextResponse.json({ items, stats })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, quantity } = await req.json()
  if (!id || typeof quantity !== 'number' || quantity < 0) {
    return NextResponse.json({ error: 'id e quantity (>= 0) obrigatórios' }, { status: 400 })
  }

  const updated = updateStock(id, quantity)
  if (!updated) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
  return NextResponse.json(updated)
}
