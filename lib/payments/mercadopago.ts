import crypto from 'crypto'

/**
 * Integração com Mercado Pago — Assinaturas (preapproval).
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/subscriptions
 *
 * Env necessárias:
 *  - MP_ACCESS_TOKEN: token de produção da aplicação (Suas integrações → credenciais)
 *  - MP_WEBHOOK_SECRET: assinatura secreta do webhook (opcional, mas recomendado)
 *  - NEXT_PUBLIC_APP_URL: URL pública do app (ex.: https://merly.com.br)
 */

const MP_API = 'https://api.mercadopago.com'

export function mpConfigured(): boolean {
  return !!process.env.MP_ACCESS_TOKEN
}

interface CreatePreapprovalParams {
  planName: string
  price: number
  interval: string // monthly | yearly (aceita variações 'mensal'/'anual')
  payerEmail: string
  clientId: string
}

export interface PreapprovalResult {
  id: string
  initPoint: string
  status: string
}

function isYearly(interval: string): boolean {
  const i = interval.toLowerCase()
  return i.includes('year') || i.includes('anual') || i.includes('anu')
}

export async function createPreapproval(params: CreatePreapprovalParams): Promise<PreapprovalResult> {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://merly.com.br'
  const yearly = isYearly(params.interval)

  const body = {
    reason: `merly — Plano ${params.planName}`,
    external_reference: params.clientId,
    payer_email: params.payerEmail,
    auto_recurring: {
      frequency: yearly ? 12 : 1,
      frequency_type: 'months',
      // preço do plano é sempre exibido /mês; anual cobra 12x de uma vez
      transaction_amount: Math.round((yearly ? params.price * 12 : params.price) * 100) / 100,
      currency_id: 'BRL',
    },
    back_url: `${appUrl}/minha-conta?checkout=retorno`,
    status: 'pending',
  }

  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Mercado Pago retornou ${res.status}: ${data?.message ?? JSON.stringify(data).slice(0, 200)}`)
  }

  return { id: data.id, initPoint: data.init_point, status: data.status }
}

export async function getPreapproval(id: string): Promise<{
  id: string
  status: string
  external_reference: string | null
  payer_email: string | null
} | null> {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado')

  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) return null
  const data = await res.json()
  return {
    id: data.id,
    status: data.status,
    external_reference: data.external_reference ?? null,
    payer_email: data.payer_email ?? null,
  }
}

export async function cancelPreapproval(id: string): Promise<boolean> {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado')

  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'cancelled' }),
    signal: AbortSignal.timeout(15000),
  })
  return res.ok
}

/**
 * Valida a assinatura x-signature do webhook do Mercado Pago.
 * Manifest: "id:{data.id};request-id:{x-request-id};ts:{ts};"
 * Retorna true se MP_WEBHOOK_SECRET não estiver configurado (validação desativada).
 */
export function validateWebhookSignature(opts: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true
  if (!opts.xSignature || !opts.dataId) return false

  const parts: Record<string, string> = {}
  for (const seg of opts.xSignature.split(',')) {
    const [k, v] = seg.split('=').map(s => s?.trim())
    if (k && v) parts[k] = v
  }
  if (!parts.ts || !parts.v1) return false

  let manifest = `id:${opts.dataId.toLowerCase()};`
  if (opts.xRequestId) manifest += `request-id:${opts.xRequestId};`
  manifest += `ts:${parts.ts};`

  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(parts.v1))
  } catch {
    return false
  }
}

export type SubscriptionStatus = 'none' | 'pending' | 'active' | 'paused' | 'cancelled'

export function mapMpStatus(mpStatus: string): SubscriptionStatus {
  switch (mpStatus) {
    case 'authorized': return 'active'
    case 'paused': return 'paused'
    case 'cancelled': return 'cancelled'
    case 'pending': return 'pending'
    default: return 'pending'
  }
}
