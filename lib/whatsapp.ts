/**
 * WhatsApp sender via Evolution API (https://doc.evolution-api.com)
 * Compatible with most self-hosted and cloud Evolution instances.
 */

export interface WhatsAppConfig {
  apiUrl:      string
  apiKey:      string
  apiInstance: string
  phoneNumber: string
}

export interface SendResult {
  ok:      boolean
  message: string
  error?:  string
}

function formatPhone(phone: string): string {
  // Strip non-digits and ensure country code (BR default: 55)
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 11 || digits.length === 10) return `55${digits}`
  return digits
}

export async function sendWhatsApp(
  config: WhatsAppConfig,
  text: string
): Promise<SendResult> {
  const { apiUrl, apiKey, apiInstance, phoneNumber } = config

  if (!apiUrl || !apiKey || !apiInstance || !phoneNumber) {
    return { ok: false, message: '', error: 'Configuração incompleta — preencha URL, chave, instância e número.' }
  }

  const url     = `${apiUrl.replace(/\/$/, '')}/message/sendText/${apiInstance}`
  const number  = formatPhone(phoneNumber)
  const payload = {
    number,
    options:     { delay: 1000, presence: 'composing' },
    textMessage: { text },
  }

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, message: '', error: `API retornou ${res.status}: ${body.slice(0, 120)}` }
    }
    const data = await res.json()
    return { ok: true, message: data?.key?.id ?? 'enviado' }
  } catch (err: any) {
    return { ok: false, message: '', error: err?.message ?? 'Erro de conexão' }
  }
}

// ── Message templates ─────────────────────────────────────────────────────────

import { getMP } from './marketplaces'

export function saleMsgTemplate(params: {
  clientName: string
  product:    string
  value:      number
  marketplace: string
  orderId:    string
}): string {
  const mp = getMP(params.marketplace).label
  return (
    `🛒 *Nova venda — ${params.clientName}*\n\n` +
    `📦 ${params.product}\n` +
    `💰 R$ ${params.value.toFixed(2).replace('.', ',')}\n` +
    `🏪 ${mp} · #${params.orderId}\n\n` +
    `_merly_`
  )
}

export function feedbackMsgTemplate(params: {
  clientName:  string
  customer:    string
  rating:      number
  comment:     string
  marketplace: string
}): string {
  const mp      = getMP(params.marketplace).label
  const stars   = '⭐'.repeat(params.rating) + '☆'.repeat(5 - params.rating)
  const preview = params.comment.length > 80 ? params.comment.slice(0, 80) + '…' : params.comment
  return (
    `⭐ *Nova avaliação — ${params.clientName}*\n\n` +
    `${stars} (${params.rating}/5)\n` +
    `👤 ${params.customer} · ${mp}\n\n` +
    `"${preview}"\n\n` +
    `_merly_`
  )
}

export function testMsgTemplate(clientName: string): string {
  return (
    `✅ *Teste de notificação — ${clientName}*\n\n` +
    `Suas notificações via WhatsApp estão configuradas e funcionando corretamente.\n\n` +
    `_merly_`
  )
}
