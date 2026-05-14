'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, Star, CheckCircle2, Clock } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Feedback } from '@/lib/types'
import { formatTimeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ClienteFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/feedbacks?limit=50', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setFeedbacks(d.data); setStats(d.stats); setLoading(false) })
  }, [])

  return (
    <div className="flex flex-col flex-1 bg-background">
      <Header title="Minhas Avaliações" subtitle="Feedbacks dos seus clientes" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)} ★</p>
              <p className="text-xs text-muted-foreground">Média</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Sem resposta</p>
            </CardContent></Card>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map(fb => (
              <Card key={fb.id} className={cn(!fb.replied && 'border-l-4 border-l-orange-400')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold">{fb.customer}</span>
                    <MarketplaceBadge marketplace={fb.marketplace} size="xs" />
                    {fb.replied
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"><CheckCircle2 className="h-3 w-3" /> Respondido</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700"><Clock className="h-3 w-3" /> Pendente</span>
                    }
                    <span className="ml-auto text-xs text-muted-foreground">{formatTimeAgo(fb.createdAt)}</span>
                  </div>
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`text-sm ${i <= fb.rating ? 'text-yellow-400' : 'text-muted'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-1">{fb.title}</p>
                  <p className="text-xs text-muted-foreground">{fb.comment}</p>
                  {fb.replyText && (
                    <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-2.5">
                      <p className="text-[10px] font-semibold text-blue-700 mb-0.5">Resposta da equipe:</p>
                      <p className="text-xs text-blue-800">{fb.replyText}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
