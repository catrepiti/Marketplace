import { NextResponse } from 'next/server'
import { getQuestions, updateQuestionAnswer } from '@/lib/mock/store'
import { Marketplace } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const marketplace = searchParams.get('marketplace') as Marketplace | null
  const answered = searchParams.get('answered')
  const search = searchParams.get('search')?.toLowerCase()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  let questions = getQuestions()

  if (marketplace) questions = questions.filter(q => q.marketplace === marketplace)
  if (answered !== null && answered !== '') questions = questions.filter(q => String(q.answered) === answered)
  if (search) questions = questions.filter(q =>
    q.customer.toLowerCase().includes(search) ||
    q.product.toLowerCase().includes(search) ||
    q.question.toLowerCase().includes(search)
  )

  const total = questions.length
  const pending = questions.filter(q => !q.answered).length
  const answered_count = questions.filter(q => q.answered).length

  const start = (page - 1) * limit
  const data = questions.slice(start, start + limit)

  return NextResponse.json({ data, total, pending, answered: answered_count, page, limit })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, answer } = body
  if (!id || !answer) return NextResponse.json({ error: 'id e answer obrigatórios' }, { status: 400 })
  const q = updateQuestionAnswer(id, answer)
  if (!q) return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
  return NextResponse.json(q)
}
