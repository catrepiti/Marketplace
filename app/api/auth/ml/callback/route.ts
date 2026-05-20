import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code      = searchParams.get('code')
  const state     = searchParams.get('state') ?? ''
  const mlError   = searchParams.get('error')
  const mlErrDesc = searchParams.get('error_description') ?? ''

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'https://merly.com.br').replace(/\/$/, '')

  // ML returned an error
  if (mlError) {
    const msg = encodeURIComponent(`ML recusou: ${mlError}${mlErrDesc ? ' — ' + mlErrDesc : ''}`)
    return NextResponse.redirect(`${baseUrl}/admin/clientes?ml_error=${msg}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/admin/clientes?ml_error=${encodeURIComponent('Código não recebido do ML')}`)
  }

  // Parse state — supports both plain "clientId:MP" and base64
  let clientId = ''
  let marketplace = ''
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8')
    ;[clientId, marketplace] = decoded.split(':')
  } catch {
    ;[clientId, marketplace] = state.split(':')
  }
  if (!clientId) [clientId, marketplace] = state.split(':')

  if (!clientId || marketplace !== 'MERCADOLIVRE') {
    return NextResponse.redirect(`${baseUrl}/admin/clientes?ml_error=${encodeURIComponent('State inválido: ' + state)}`)
  }

  // Load credentials
  const acc = await prisma.marketplaceAccount.findUnique({
    where: { clientId_marketplace: { clientId, marketplace: 'MERCADOLIVRE' } },
  })
  if (!acc?.appId || !acc?.appSecret) {
    return NextResponse.redirect(
      `${baseUrl}/admin/clientes/${clientId}?ml_error=${encodeURIComponent('Salve o App ID e App Secret antes de autorizar')}`
    )
  }

  // Exchange code → tokens
  const redirectUri = `${baseUrl}/api/auth/ml/callback`
  try {
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     acc.appId,
        client_secret: acc.appSecret,
        code,
        redirect_uri:  redirectUri,
      }).toString(),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      const errMsg = tokenData.error_description ?? tokenData.error ?? tokenData.message ?? `HTTP ${tokenRes.status}`
      return NextResponse.redirect(
        `${baseUrl}/admin/clientes/${clientId}?ml_error=${encodeURIComponent('Falha na troca do token: ' + errMsg)}`
      )
    }

    await prisma.marketplaceAccount.update({
      where: { clientId_marketplace: { clientId, marketplace: 'MERCADOLIVRE' } },
      data: {
        accessToken:  tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        sellerId:     tokenData.user_id ? String(tokenData.user_id) : acc.sellerId,
        expiresAt:    tokenData.expires_in ? new Date(Date.now() + Number(tokenData.expires_in) * 1000) : null,
        status:       'active',
      },
    })

    return NextResponse.redirect(`${baseUrl}/admin/clientes/${clientId}?ml_connected=1`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.redirect(
      `${baseUrl}/admin/clientes/${clientId}?ml_error=${encodeURIComponent('Erro interno: ' + msg)}`
    )
  }
}
