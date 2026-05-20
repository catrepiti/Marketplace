import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 403 })

  const acc = await prisma.marketplaceAccount.findUnique({
    where: { clientId_marketplace: { clientId: params.id, marketplace: 'MERCADOLIVRE' } },
  })

  const result: Record<string, any> = {
    hasAppId:     !!acc?.appId,
    hasAppSecret: !!acc?.appSecret,
    hasToken:     !!acc?.accessToken,
    tokenLen:     acc?.accessToken?.length ?? 0,
    tokenPreview: acc?.accessToken?.slice(0, 25) ?? null,
    sellerId:     acc?.sellerId ?? null,
  }

  if (!acc?.accessToken) {
    return NextResponse.json({ ok: false, step: 'no_token', ...result })
  }

  // Test 1 — identity
  try {
    const r1 = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${acc.accessToken}` },
    })
    const d1 = await r1.json()
    if (!r1.ok) {
      return NextResponse.json({ ok: false, step: 'token_invalid', mlError: d1, ...result })
    }
    result.mlUser    = { id: d1.id, nickname: d1.nickname }
    result.sellerId  = String(d1.id)

    // Update sellerId in DB if different
    if (acc.sellerId !== String(d1.id)) {
      await prisma.marketplaceAccount.update({
        where: { clientId_marketplace: { clientId: params.id, marketplace: 'MERCADOLIVRE' } },
        data: { sellerId: String(d1.id) },
      })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, step: 'network_error', error: String(e), ...result })
  }

  // Test 2 — orders
  try {
    const from = new Date(Date.now() - 7 * 86400000).toISOString()
    const r2 = await fetch(
      `https://api.mercadolibre.com/orders/search?seller=${result.sellerId}&order.date_created.from=${from}&limit=1`,
      { headers: { Authorization: `Bearer ${acc.accessToken}` } }
    )
    const d2 = await r2.json()
    result.ordersTest = r2.ok ? `${d2.paging?.total ?? 0} pedidos (7 dias)` : `Erro: ${d2.message}`
  } catch { result.ordersTest = 'Erro de rede' }

  return NextResponse.json({ ok: true, step: 'connected', ...result })
}
