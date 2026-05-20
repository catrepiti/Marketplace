import { prisma } from '@/lib/prisma'
import { mlRefreshToken } from './mercadolivre'

export async function getMlToken(clientId: string): Promise<string | null> {
  const account = await prisma.marketplaceAccount.findUnique({
    where: { clientId_marketplace: { clientId, marketplace: 'MERCADOLIVRE' } },
    select: { accessToken: true, refreshToken: true, appId: true, appSecret: true, expiresAt: true, sellerId: true },
  })
  if (!account?.accessToken) return null

  // Refresh if expiring within 1 hour
  if (account.expiresAt && account.refreshToken && account.appId && account.appSecret) {
    const expiresInMs = account.expiresAt.getTime() - Date.now()
    if (expiresInMs < 3600000) {
      try {
        const tokens = await mlRefreshToken(account.appId, account.appSecret, account.refreshToken)
        await prisma.marketplaceAccount.update({
          where: { clientId_marketplace: { clientId, marketplace: 'MERCADOLIVRE' } },
          data: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          },
        })
        return tokens.access_token
      } catch { return account.accessToken }
    }
  }
  return account.accessToken
}

export async function getMlSellerId(clientId: string): Promise<string | null> {
  const account = await prisma.marketplaceAccount.findUnique({
    where: { clientId_marketplace: { clientId, marketplace: 'MERCADOLIVRE' } },
    select: { sellerId: true },
  })
  return account?.sellerId ?? null
}
