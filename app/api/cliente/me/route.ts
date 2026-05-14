import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const clientId = (session.user as any).clientId
  if (!clientId) return NextResponse.json({ accounts: [], clientName: null })

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      marketplaceAccounts: {
        select: { marketplace: true, accountName: true, status: true },
      },
    },
  })

  return NextResponse.json({
    clientName: client?.name ?? null,
    accounts: client?.marketplaceAccounts ?? [],
  })
}
