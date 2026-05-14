import { NextResponse } from 'next/server'
import { getFeedbacks, updateFeedbackReply } from '@/lib/mock/store'
import { FeedbackStats, Marketplace } from '@/lib/types'
import { MARKETPLACE_KEYS } from '@/lib/marketplaces'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const marketplace = searchParams.get('marketplace') as Marketplace | null
  const rating = searchParams.get('rating')
  const replied = searchParams.get('replied')
  const search = searchParams.get('search')?.toLowerCase()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  let feedbacks = getFeedbacks()

  if (marketplace) feedbacks = feedbacks.filter(f => f.marketplace === marketplace)
  if (rating) feedbacks = feedbacks.filter(f => f.rating === parseInt(rating))
  if (replied === 'true') feedbacks = feedbacks.filter(f => f.replied)
  if (replied === 'false') feedbacks = feedbacks.filter(f => !f.replied)
  if (search) feedbacks = feedbacks.filter(f =>
    f.customer.toLowerCase().includes(search) ||
    f.product.toLowerCase().includes(search) ||
    f.comment.toLowerCase().includes(search)
  )

  const all = getFeedbacks()
  const stats: FeedbackStats = {
    total: all.length,
    pending: all.filter(f => !f.replied).length,
    replied: all.filter(f => f.replied).length,
    averageRating: +(all.reduce((s, f) => s + f.rating, 0) / all.length).toFixed(1),
    byRating: {
      1: all.filter(f => f.rating === 1).length,
      2: all.filter(f => f.rating === 2).length,
      3: all.filter(f => f.rating === 3).length,
      4: all.filter(f => f.rating === 4).length,
      5: all.filter(f => f.rating === 5).length,
    },
    byMarketplace: MARKETPLACE_KEYS.map(mp => {
      const mpAll = all.filter(f => f.marketplace === mp)
      return {
        marketplace: mp,
        total: mpAll.length,
        averageRating: mpAll.length > 0
          ? +(mpAll.reduce((s, f) => s + f.rating, 0) / mpAll.length).toFixed(1)
          : 0,
        pending: mpAll.filter(f => !f.replied).length,
      }
    }).filter(mp => mp.total > 0),
  }

  const total = feedbacks.length
  const start = (page - 1) * limit
  const data = feedbacks.slice(start, start + limit)

  return NextResponse.json({ data, total, page, limit, stats })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, replyText } = body

  if (!id || !replyText?.trim()) {
    return NextResponse.json({ error: 'id e replyText são obrigatórios' }, { status: 400 })
  }

  const updated = updateFeedbackReply(id, replyText)
  if (!updated) return NextResponse.json({ error: 'Feedback não encontrado' }, { status: 404 })

  return NextResponse.json(updated)
}
