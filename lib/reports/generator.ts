import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { getMP } from '@/lib/marketplaces'

export interface WeekWindow {
  weekStart: Date
  weekEnd: Date
}

/** Semana fechada mais recente: segunda 00:00 até domingo 23:59:59 anteriores a hoje. */
export function lastClosedWeek(ref = new Date()): WeekWindow {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=dom
  const daysSinceMonday = (day + 6) % 7
  const thisMonday = new Date(d)
  thisMonday.setDate(d.getDate() - daysSinceMonday)
  const weekStart = new Date(thisMonday)
  weekStart.setDate(thisMonday.getDate() - 7)
  const weekEnd = new Date(thisMonday.getTime() - 1)
  return { weekStart, weekEnd }
}

interface WeekMetrics {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  avgTicket: number
  totalExpenses: number
  netResult: number
  revenueDelta: number
  byMarketplace: { marketplace: string; revenue: number; orders: number }[]
  topProducts: { name: string; revenue: number; quantity: number }[]
  expensesByCategory: { category: string; amount: number }[]
}

async function collectMetrics(clientId: string, window: WeekWindow): Promise<WeekMetrics> {
  const { weekStart, weekEnd } = window
  const prevStart = new Date(weekStart.getTime() - 7 * 24 * 3600 * 1000)
  const prevEnd = new Date(weekStart.getTime() - 1)

  const [sales, prevSales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: {
        clientId,
        status: { in: ['paid', 'delivered', 'closed'] },
        saleDate: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.sale.findMany({
      where: {
        clientId,
        status: { in: ['paid', 'delivered', 'closed'] },
        saleDate: { gte: prevStart, lte: prevEnd },
      },
      select: { totalPrice: true },
    }),
    prisma.expense.findMany({
      where: { clientId, date: { gte: weekStart, lte: weekEnd } },
    }),
  ])

  const totalRevenue = sales.reduce((s, v) => s + v.totalPrice, 0)
  const prevRevenue = prevSales.reduce((s, v) => s + v.totalPrice, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  const byMarketplaceMap: Record<string, { revenue: number; orders: number }> = {}
  const productMap: Record<string, { revenue: number; quantity: number }> = {}
  for (const s of sales) {
    byMarketplaceMap[s.marketplace] = byMarketplaceMap[s.marketplace] ?? { revenue: 0, orders: 0 }
    byMarketplaceMap[s.marketplace].revenue += s.totalPrice
    byMarketplaceMap[s.marketplace].orders += 1
    productMap[s.product] = productMap[s.product] ?? { revenue: 0, quantity: 0 }
    productMap[s.product].revenue += s.totalPrice
    productMap[s.product].quantity += s.quantity
  }

  const expensesByCategoryMap: Record<string, number> = {}
  for (const e of expenses) {
    expensesByCategoryMap[e.category] = (expensesByCategoryMap[e.category] ?? 0) + e.amount
  }

  return {
    totalRevenue,
    totalOrders: sales.length,
    totalItems: sales.reduce((s, v) => s + v.quantity, 0),
    avgTicket: sales.length > 0 ? totalRevenue / sales.length : 0,
    totalExpenses,
    netResult: totalRevenue - totalExpenses,
    revenueDelta: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
    byMarketplace: Object.entries(byMarketplaceMap)
      .map(([marketplace, v]) => ({ marketplace, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    topProducts: Object.entries(productMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    expensesByCategory: Object.entries(expensesByCategoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
  }
}

const fmtBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

async function generateAISummary(
  clientName: string,
  metrics: WeekMetrics,
  window: WeekWindow,
): Promise<{ summary: string; actions: string[] }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { summary: 'Resumo automático indisponível (ANTHROPIC_API_KEY não configurada).', actions: [] }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const period = `${window.weekStart.toLocaleDateString('pt-BR')} a ${window.weekEnd.toLocaleDateString('pt-BR')}`

  const prompt = `Você é um analista sênior de e-commerce e marketplaces escrevendo o relatório semanal de um cliente de assessoria.

CLIENTE: ${clientName}
PERÍODO: ${period}

MÉTRICAS DA SEMANA:
- Faturamento: ${fmtBRL(metrics.totalRevenue)} (${metrics.revenueDelta >= 0 ? '+' : ''}${metrics.revenueDelta.toFixed(1)}% vs semana anterior)
- Pedidos: ${metrics.totalOrders} (${metrics.totalItems} itens, ticket médio ${fmtBRL(metrics.avgTicket)})
- Despesas: ${fmtBRL(metrics.totalExpenses)}
- Resultado líquido: ${fmtBRL(metrics.netResult)}

POR MARKETPLACE:
${metrics.byMarketplace.map(m => `- ${getMP(m.marketplace).label}: ${fmtBRL(m.revenue)} (${m.orders} pedidos)`).join('\n') || '- Sem vendas registradas'}

TOP PRODUTOS:
${metrics.topProducts.map(p => `- ${p.name}: ${fmtBRL(p.revenue)} (${p.quantity} un)`).join('\n') || '- Sem produtos'}

DESPESAS POR CATEGORIA:
${metrics.expensesByCategory.map(e => `- ${e.category}: ${fmtBRL(e.amount)}`).join('\n') || '- Sem despesas registradas'}

Responda APENAS em JSON válido:
{
  "summary": "resumo executivo da semana em 3-5 frases, tom profissional e direto, destacando o que mais importa (crescimento/queda, concentração de canal, margem). Em português.",
  "actions": ["3 a 4 ações concretas e priorizadas para a próxima semana, cada uma em 1 frase"]
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return { summary: parsed.summary ?? '', actions: parsed.actions ?? [] }
    }
  } catch (err) {
    console.error('[reports] AI summary failed:', err)
  }
  return { summary: 'Resumo automático indisponível nesta semana. Métricas completas acima.', actions: [] }
}

export async function generateReportForClient(clientId: string, window?: WeekWindow) {
  const win = window ?? lastClosedWeek()
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true } })
  if (!client) throw new Error('Cliente não encontrado')

  const metrics = await collectMetrics(clientId, win)
  const ai = await generateAISummary(client.name, metrics, win)

  return prisma.weeklyReport.upsert({
    where: { clientId_weekStart: { clientId, weekStart: win.weekStart } },
    create: {
      clientId,
      weekStart: win.weekStart,
      weekEnd: win.weekEnd,
      totalRevenue: metrics.totalRevenue,
      totalOrders: metrics.totalOrders,
      avgTicket: metrics.avgTicket,
      totalExpenses: metrics.totalExpenses,
      netResult: metrics.netResult,
      revenueDelta: metrics.revenueDelta,
      metricsJson: JSON.stringify({
        byMarketplace: metrics.byMarketplace,
        topProducts: metrics.topProducts,
        expensesByCategory: metrics.expensesByCategory,
        totalItems: metrics.totalItems,
      }),
      aiSummary: ai.summary,
      aiActions: JSON.stringify(ai.actions),
      status: 'generated',
    },
    update: {
      totalRevenue: metrics.totalRevenue,
      totalOrders: metrics.totalOrders,
      avgTicket: metrics.avgTicket,
      totalExpenses: metrics.totalExpenses,
      netResult: metrics.netResult,
      revenueDelta: metrics.revenueDelta,
      metricsJson: JSON.stringify({
        byMarketplace: metrics.byMarketplace,
        topProducts: metrics.topProducts,
        expensesByCategory: metrics.expensesByCategory,
        totalItems: metrics.totalItems,
      }),
      aiSummary: ai.summary,
      aiActions: JSON.stringify(ai.actions),
      status: 'generated',
    },
  })
}

export async function generateReportsForAllClients(window?: WeekWindow) {
  const clients = await prisma.client.findMany({ select: { id: true, name: true } })
  const results: { clientId: string; name: string; ok: boolean; error?: string }[] = []
  for (const c of clients) {
    try {
      await generateReportForClient(c.id, window)
      results.push({ clientId: c.id, name: c.name, ok: true })
    } catch (err) {
      results.push({ clientId: c.id, name: c.name, ok: false, error: err instanceof Error ? err.message : 'erro' })
    }
  }
  return results
}
