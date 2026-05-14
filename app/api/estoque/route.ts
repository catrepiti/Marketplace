import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getInventory, getInventoryStats, updateStock, StockStatus } from '@/lib/mock/inventory-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
