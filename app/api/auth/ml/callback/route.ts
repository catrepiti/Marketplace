import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mlExchangeCode } from '@/lib/integrations/mercadolivre'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state') // format: "{clientId}:{marketplace}"
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://merly.com.br'

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/admin/clientes?ml_error=${error ?? 'missing_code'}`)
  }

  const [clientId, marketplace] = state.split(':')
  if (!clientId || marketplace !== 'MERCADOLIVRE') {
    return NextResponse.redirect(`${baseUrl}/admin/clientes?ml_error=invalid_state`)
  }

  try {
    const account = await prisma.marketplaceAccount.findUnique({
      where: { clientId_marketplace: { clientId, marketplace: 'MERCADOLIVRE' } },
    })
    if (!account?.appId || !account?.appSecret) {
      return NextResponse.redirect(`${baseUrl}/admin/clientes/${clientId}?ml_error=missing_credentials`)
    }

    const redirectUri = `${baseUrl}/api/auth/ml/callback`
    const tokens = await mlExchangeCode(account.appId, account.appSecret, code, redirectUri)

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    await prisma.marketplaceAccount.update({
      where: { clientId_marketplace: { clientId, marketplace: 'MERCADOLIVRE' } },
      data: {
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        sellerId:     String(tokens.user_id),
        expiresAt,
        status: 'active',
      },
    })

    return NextResponse.redirect(`${baseUrl}/admin/clientes/${clientId}?ml_connected=1`)
  } catch (err) {
    console.error('ML OAuth callback error:', err)
    return NextResponse.redirect(`${baseUrl}/admin/clientes/${clientId}?ml_error=exchange_failed`)
  }
}
