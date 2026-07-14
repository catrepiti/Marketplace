import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPreapproval, mapMpStatus, validateWebhookSignature } from '@/lib/payments/mercadopago'

export const dynamic = 'force-dynamic'

/**
 * Webhook do Mercado Pago — ativa/pausa/cancela a assinatura do cliente
 * automaticamente quando o status muda no MP.
 *
 * Configurar no painel MP (Suas integrações → Webhooks):
 *   URL: https://merly.com.br/api/webhooks/mercadopago
 *   Evento: Planos e assinaturas (subscription_preapproval)
 */
export async function POST(request: Request) {
  const url = new URL(request.url)

  let body: any = {}
  try {
    body = await request.json()
  } catch {}

  const type = body?.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic')
  const dataId: string | null = body?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id')

  // Só tratamos eventos de assinatura; outros tipos respondem 200 para o MP não reenviar
  if (!dataId || (type && !String(type).includes('preapproval'))) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const valid = validateWebhookSignature({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataId: String(dataId),
  })
  if (!valid) {
    return NextResponse.json({ error: 'Assinatura do webhook inválida' }, { status: 401 })
  }

  try {
    const preapproval = await getPreapproval(String(dataId))
    if (!preapproval) return NextResponse.json({ ok: true, notFound: true })

    const client =
      (preapproval.external_reference
        ? await prisma.client.findUnique({ where: { id: preapproval.external_reference } })
        : null) ??
      (await prisma.client.findFirst({ where: { mpPreapprovalId: preapproval.id } }))

    if (!client) return NextResponse.json({ ok: true, clientNotFound: true })

    const status = mapMpStatus(preapproval.status)
    await prisma.client.update({
      where: { id: client.id },
      data: {
        mpPreapprovalId: preapproval.id,
        subscriptionStatus: status,
        subscriptionUpdatedAt: new Date(),
        // assinatura ativa encerra o trial
        ...(status === 'active' ? { trialEndsAt: null } : {}),
      },
    })

    console.log(`[mp-webhook] cliente ${client.name}: assinatura → ${status}`)
    return NextResponse.json({ ok: true, status })
  } catch (err) {
    console.error('[mp-webhook] erro:', err)
    // 500 faz o MP reenviar a notificação depois
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
