import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 503 })
  }

  const body = await req.json()
  const { type, product, marketplace, rating, comment, title, question } = body

  if (!type || !product) {
    return NextResponse.json({ error: 'type e product são obrigatórios' }, { status: 400 })
  }

  let prompt: string

  if (type === 'feedback') {
    prompt = `Você é um especialista em atendimento ao cliente de e-commerce brasileiro.
Gere uma resposta profissional, cordial e personalizada para a seguinte avaliação de produto publicada no ${marketplace ?? 'marketplace'}:

Produto: ${product}
Nota: ${rating ?? '?'}/5 estrelas
Título: ${title ?? '(sem título)'}
Comentário do cliente: ${comment ?? '(sem comentário)'}

Instruções:
- Se a nota for 4 ou 5: agradeça genuinamente, destaque o valor do feedback positivo, reforce a qualidade
- Se a nota for 3: agradeça, reconheça pontos de melhoria sem se defender excessivamente, ofereça suporte
- Se a nota for 1 ou 2: peça desculpas com empatia, assuma responsabilidade, ofereça solução concreta (troca, reembolso, suporte)
- Resposta deve ter entre 40 e 100 palavras
- Tom: humano, caloroso, nunca robótico ou genérico
- NÃO use saudações formais como "Prezado(a)"
- Comece diretamente com o agradecimento ou pedido de desculpas
- Assine como "Equipe ${marketplace ?? 'da loja'}"
- Responda apenas com o texto da resposta, sem explicações adicionais`

  } else {
    prompt = `Você é um especialista em atendimento ao cliente de e-commerce brasileiro.
Gere uma resposta clara, objetiva e útil para a seguinte pergunta de comprador publicada no ${marketplace ?? 'marketplace'}:

Produto: ${product}
Pergunta do comprador: ${question}

Instruções:
- Responda a pergunta diretamente no início
- Inclua informações técnicas relevantes do produto se fizer sentido
- Seja objetivo mas amigável (entre 30 e 80 palavras)
- NÃO use saudações formais como "Prezado(a)"
- Incentive sutilmente a compra sem ser forçado (ex: "Qualquer dúvida, estamos aqui!")
- Assine como "Equipe ${marketplace ?? 'da loja'}"
- Responda apenas com o texto da resposta, sem explicações adicionais`
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ suggestion: text })
  } catch (err: any) {
    console.error('[AI suggest]', err)
    return NextResponse.json({ error: err.message ?? 'Erro ao gerar sugestão' }, { status: 500 })
  }
}
