import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR')

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'ASSESSOR'].includes(role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const report = await prisma.weeklyReport.findUnique({
    where: { id: params.id },
    include: { client: { select: { name: true, notificationConfig: true } } },
  })
  if (!report) return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })

  const config = report.client.notificationConfig
  if (!config || !config.active || !config.phoneNumber) {
    return NextResponse.json(
      { error: 'Cliente sem WhatsApp configurado. Configure em Notificações.' },
      { status: 400 }
    )
  }

  const actions: string[] = JSON.parse(report.aiActions || '[]')
  const delta = report.revenueDelta >= 0
    ? `▲ +${report.revenueDelta.toFixed(1)}%`
    : `▼ ${report.revenueDelta.toFixed(1)}%`

  const text =
    `📊 *Relatório Semanal — ${report.client.name}*\n` +
    `_${fmtDate(report.weekStart)} a ${fmtDate(report.weekEnd)}_\n\n` +
    `💰 Faturamento: *${fmtBRL(report.totalRevenue)}* (${delta})\n` +
    `📦 Pedidos: ${report.totalOrders} · Ticket médio ${fmtBRL(report.avgTicket)}\n` +
    `💸 Despesas: ${fmtBRL(report.totalExpenses)}\n` +
    `✅ Resultado: *${fmtBRL(report.netResult)}*\n\n` +
    (report.aiSummary ? `📝 *Análise:*\n${report.aiSummary}\n\n` : '') +
    (actions.length > 0
      ? `🎯 *Ações da semana:*\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n`
      : '') +
    `_Relatório gerado automaticamente pela assessoria_`

  const result = await sendWhatsApp(
    {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      apiInstance: config.apiInstance,
      phoneNumber: config.phoneNumber,
    },
    text
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Falha no envio' }, { status: 502 })
  }

  await prisma.weeklyReport.update({
    where: { id: report.id },
    data: { status: 'sent', sentAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
