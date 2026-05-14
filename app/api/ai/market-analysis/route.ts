import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }), { status: 503 })
  }

  const body = await req.json()
  const { report, monthlyGoal, period } = body

  const topExpensive = report.products
    .filter((p: any) => p.position === 'most_expensive' || p.position === 'above_avg')
    .slice(0, 5)
    .map((p: any) => `- ${p.name} (${p.marketplace}): R$${p.yourPrice} vs média R$${p.avgMarket} (${p.priceDiff > 0 ? '+' : ''}${p.priceDiff}%)`)
    .join('\n')

  const topCheap = report.products
    .filter((p: any) => p.position === 'cheapest')
    .slice(0, 3)
    .map((p: any) => `- ${p.name}: R$${p.yourPrice} (mais barato do mercado, pode subir ${((report.products.find((x: any) => x.id === p.id)?.avgMarket - p.yourPrice) / p.yourPrice * 100).toFixed(1)}%)`)
    .join('\n')

  const categorySummary = report.categories
    .map((c: any) => `- ${c.category}: score competitivo ${c.avgPositionScore}/100, ${c.expensiveCount} produto(s) acima da média`)
    .join('\n')

  const prompt = `Você é um especialista em estratégia de pricing para e-commerce brasileiro.
Analise os dados de inteligência competitiva abaixo e gere um relatório executivo com recomendações práticas.

## Dados do relatório (${period ?? 'período atual'})

Score competitivo geral: ${report.overallScore}/100
Oportunidade de receita identificada: R$${report.totalOpportunity}
${monthlyGoal ? `Meta de faturamento do mês: R$${monthlyGoal.toLocaleString('pt-BR')}` : ''}

### Produtos acima da média de mercado (risco de perda de vendas):
${topExpensive || 'Nenhum produto identificado acima da média.'}

### Produtos onde você é o mais barato (oportunidade de aumento):
${topCheap || 'Nenhum produto identificado como mais barato.'}

### Resumo por categoria:
${categorySummary}

## Instruções para o relatório:
Gere uma análise executiva em português com:

1. **Diagnóstico Rápido** (2-3 frases sobre a posição competitiva geral)
2. **Top 3 Ações Prioritárias** (ações concretas com impacto estimado em reais)
3. **Estratégia de Precificação** (recomendação de posicionamento por categoria)
4. **Projeção para a Meta** (se meta foi fornecida: como o ajuste de preços contribui para atingi-la; caso contrário, estime potencial de crescimento)
5. **Alertas** (riscos a evitar)

Seja direto, use dados específicos dos produtos listados, mantenha um tom executivo e prático.`

  // Stream the response using SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = await client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
