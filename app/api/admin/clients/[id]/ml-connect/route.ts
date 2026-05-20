import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const acc = await prisma.marketplaceAccount.findUnique({
    where: { clientId_marketplace: { clientId: params.id, marketplace: 'MERCADOLIVRE' } },
  })
  if (!acc?.appId)
    return NextResponse.json({ error: 'Salve o App ID primeiro' }, { status: 400 })
  if (!acc?.appSecret)
    return NextResponse.json({ error: 'Salve o App Secret primeiro' }, { status: 400 })

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'https://merly.com.br').replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/auth/ml/callback`

  // state = base64("clientId:MERCADOLIVRE") — safe for URL
  const state = Buffer.from(`${params.id}:MERCADOLIVRE`).toString('base64')

  const url = [
    'https://auth.mercadolivre.com.br/authorization',
    `?response_type=code`,
    `&client_id=${acc.appId}`,
    `&redirect_uri=${encodeURIComponent(redirectUri)}`,
    `&state=${state}`,
  ].join('')

  // Return the exact redirect URI so admin can verify it matches ML config
  return NextResponse.json({ url, redirectUri })
}
