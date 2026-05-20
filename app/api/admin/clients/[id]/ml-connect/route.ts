import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mlAuthUrl } from '@/lib/integrations/mercadolivre'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const account = await prisma.marketplaceAccount.findUnique({
    where: { clientId_marketplace: { clientId: params.id, marketplace: 'MERCADOLIVRE' } },
  })
  if (!account?.appId) {
    return NextResponse.json({ error: 'Salve o App ID primeiro' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://merly.com.br'
  const redirectUri = `${baseUrl}/api/auth/ml/callback`
  const state = `${params.id}:MERCADOLIVRE`
  const url = mlAuthUrl(account.appId, redirectUri, state)

  return NextResponse.json({ url })
}
