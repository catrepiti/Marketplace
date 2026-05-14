'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  MessageSquare, Search, Star, CheckCircle2, Clock, Send,
  ChevronLeft, ChevronRight, HelpCircle,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Feedback, FeedbackStats, Question } from '@/lib/types'
import { formatTimeAgo, marketplaceConfig } from '@/lib/utils'
import { MARKETPLACE_LIST } from '@/lib/marketplaces'
import { cn } from '@/lib/utils'
import { AiSuggestButton } from '@/components/feedbacks/AiSuggestButton'

const PAGE_SIZE = 20
type Tab = 'avaliacoes' | 'perguntas'

// Dark-mode safe accent per marketplace
const MP_DARK: Record<string, { text: string; dot: string; bar: string; glow: string }> = {
  mercadolivre: { text: 'text-yellow-400',  dot: 'bg-yellow-400',  bar: 'bg-yellow-400/20 border-yellow-400/20',  glow: 'from-yellow-500/8'  },
  shopee:       { text: 'text-orange-400',  dot: 'bg-orange-400',  bar: 'bg-orange-400/20 border-orange-400/20',  glow: 'from-orange-500/8'  },
  amazon:       { text: 'text-amber-400',   dot: 'bg-amber-400',   bar: 'bg-amber-400/20  border-amber-400/20',   glow: 'from-amber-500/8'   },
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-base leading-none ${i <= rating ? 'text-yellow-400' : 'text-white/10'}`}>★</span>
      ))}
    </span>
  )
}

function StarRatingFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {['', '5', '4', '3', '2', '1'].map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
            value === r
              ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
              : 'text-white/40 hover:text-white/70 border border-white/[0.07] bg-white/[0.03]'
          )}
        >
          {r ? `${r} ★` : 'Todas'}
        </button>
      ))}
    </div>
  )
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-white/50 w-6 text-right">{rating}★</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-white/30 w-6">{count}</span>
    </div>
  )
}

// ── Perguntas tab ──────────────────────────────────────────────────────────────

function PerguntasTab() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [marketplace, setMarketplace] = useState('')
  const [answered, setAnswered] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchQuestions = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(marketplace && { marketplace }),
        ...(answered && { answered }),
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      const res = await fetch(`/api/perguntas?${params}`, { cache: 'no-store' })
      const json = await res.json()
      setQuestions(json.data)
      setTotal(json.total)
      setPending(json.pending)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, marketplace, answered, debouncedSearch])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])
  useEffect(() => { setPage(1) }, [marketplace, answered, debouncedSearch])

  const handleAnswer = async (id: string) => {
    if (!answerText.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/perguntas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, answer: answerText }),
      })
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, answered: true, answer: answerText } : q))
      setPending(p => Math.max(0, p - 1))
      setReplyingId(null)
      setAnswerText('')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const answered_count = total - pending

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: HelpCircle, label: 'Total', value: total, accent: 'from-blue-500/15 to-transparent', border: 'border-blue-500/20', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400', textColor: 'text-white' },
          { icon: Clock, label: 'Pendentes', value: pending, accent: 'from-orange-500/15 to-transparent', border: 'border-orange-500/20', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-400', textColor: 'text-orange-400' },
          { icon: CheckCircle2, label: 'Respondidas', value: answered_count, accent: 'from-emerald-500/15 to-transparent', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', textColor: 'text-emerald-400' },
        ].map(kpi => (
          <div key={kpi.label} className={`relative rounded-xl border ${kpi.border} bg-white/[0.03] overflow-hidden`}>
            <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${kpi.accent} pointer-events-none`} />
            <div className="relative p-4 flex items-center gap-3">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.iconBg)}>
                <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
              </div>
              <div>
                <p className={cn('text-xl font-black', kpi.textColor)}>{kpi.value}</p>
                <p className="text-xs text-white/40">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por cliente, produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <select
            value={marketplace}
            onChange={e => setMarketplace(e.target.value)}
            className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          >
            <option value="">Todos marketplaces</option>
            {MARKETPLACE_LIST.map(mp => (
              <option key={mp.key} value={mp.key}>{mp.label}</option>
            ))}
          </select>
          <select
            value={answered}
            onChange={e => setAnswered(e.target.value)}
            className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          >
            <option value="">Todos status</option>
            <option value="false">Pendentes</option>
            <option value="true">Respondidas</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HelpCircle className="h-12 w-12 text-white/10 mb-3" />
          <p className="text-sm font-medium text-white/40">Nenhuma pergunta encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div
              key={q.id}
              className={cn(
                'rounded-xl border bg-white/[0.03] hover:bg-white/[0.05] transition-all p-4',
                !q.answered ? 'border-orange-500/30' : 'border-white/[0.07]'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] font-semibold text-sm text-white/60">
                  {q.customer.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-white">{q.customer}</span>
                    <MarketplaceBadge marketplace={q.marketplace} size="xs" />
                    {q.answered ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Respondida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                        <Clock className="h-3 w-3" /> Pendente
                      </span>
                    )}
                    <span className="ml-auto text-xs text-white/30">{formatTimeAgo(q.createdAt)}</span>
                  </div>
                  <p className="text-[10px] text-white/30 mb-2">Produto: {q.product}</p>
                  <div className="rounded-lg bg-white/[0.04] border border-white/[0.05] px-3 py-2 mb-2">
                    <p className="text-xs font-medium text-white/80 flex items-start gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white/30" />
                      {q.question}
                    </p>
                  </div>
                  {q.answer && (
                    <div className="rounded-lg bg-blue-500/[0.08] border border-blue-500/20 px-3 py-2 mb-2">
                      <p className="text-[10px] font-semibold text-blue-400 mb-1">Sua resposta:</p>
                      <p className="text-xs text-blue-300/80">{q.answer}</p>
                    </div>
                  )}
                  {replyingId === q.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={answerText}
                        onChange={e => setAnswerText(e.target.value)}
                        placeholder="Escreva sua resposta para o cliente..."
                        rows={3}
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2 items-center">
                        <AiSuggestButton
                          onSuggestion={text => setAnswerText(text)}
                          payload={{
                            type: 'question',
                            product: q.product,
                            marketplace: q.marketplace,
                            question: q.question,
                          }}
                        />
                        <button
                          onClick={() => handleAnswer(q.id)}
                          disabled={submitting || !answerText.trim()}
                          className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {submitting ? 'Enviando...' : 'Responder'}
                        </button>
                        <button
                          onClick={() => { setReplyingId(null); setAnswerText('') }}
                          className="h-8 rounded-lg border border-white/[0.08] px-3 text-xs text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : !q.answered && (
                    <button
                      onClick={() => { setReplyingId(q.id); setAnswerText('') }}
                      className="mt-1 inline-flex items-center gap-1.5 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-white/60 hover:text-white hover:bg-white/[0.07] transition-all"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Responder
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/30">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center px-3 text-sm font-medium text-white/60">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<Tab>('avaliacoes')
  const [pendingQuestions, setPendingQuestions] = useState(0)

  const [marketplace, setMarketplace] = useState('')
  const [rating, setRating] = useState('')
  const [replied, setReplied] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchFeedbacks = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(marketplace && { marketplace }),
        ...(rating && { rating }),
        ...(replied && { replied }),
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      const res = await fetch(`/api/feedbacks?${params}`, { cache: 'no-store' })
      const json = await res.json()
      setFeedbacks(json.data)
      setTotal(json.total)
      setStats(json.stats)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, marketplace, rating, replied, debouncedSearch])

  useEffect(() => {
    fetch('/api/perguntas?answered=false&limit=1').then(r => r.json()).then(d => setPendingQuestions(d.pending ?? 0))
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchFeedbacks()
  }, [fetchFeedbacks])

  useEffect(() => { setPage(1) }, [marketplace, rating, replied, debouncedSearch])

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/feedbacks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, replyText }),
      })
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, replied: true, replyText } : f))
      if (stats) setStats({ ...stats, pending: stats.pending - 1, replied: stats.replied + 1 })
      setReplyingId(null)
      setReplyText('')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header
        title="Feedbacks"
        subtitle="Inbox unificado de avaliações e perguntas"
        onRefresh={() => tab === 'avaliacoes' ? fetchFeedbacks(true) : undefined}
        refreshing={refreshing}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 w-fit">
          <button
            onClick={() => setTab('avaliacoes')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
              tab === 'avaliacoes'
                ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Star className="h-4 w-4" />
            Avaliações
            {stats && (
              <span className={cn(
                'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                tab === 'avaliacoes' ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/40'
              )}>
                {stats.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('perguntas')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
              tab === 'perguntas'
                ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <HelpCircle className="h-4 w-4" />
            Perguntas
            {pendingQuestions > 0 && (
              <span className={cn(
                'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                tab === 'perguntas' ? 'bg-white/20 text-white' : 'bg-orange-500/20 text-orange-400'
              )}>
                {pendingQuestions}
              </span>
            )}
          </button>
        </div>

        {/* ── Avaliações tab ── */}
        {tab === 'avaliacoes' && (
          <>
            {/* KPI stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: MessageSquare, label: 'Total', value: stats.total, accent: 'from-blue-500/15 to-transparent', border: 'border-blue-500/20', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400', textColor: 'text-white' },
                  { icon: Clock, label: 'Pendentes', value: stats.pending, accent: 'from-orange-500/15 to-transparent', border: 'border-orange-500/20', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-400', textColor: 'text-orange-400' },
                  { icon: CheckCircle2, label: 'Respondidos', value: stats.replied, accent: 'from-emerald-500/15 to-transparent', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', textColor: 'text-emerald-400' },
                  { icon: Star, label: 'Média geral', value: stats.averageRating.toFixed(1) as any, accent: 'from-amber-500/15 to-transparent', border: 'border-amber-500/20', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400', textColor: 'text-amber-400' },
                ].map(kpi => (
                  <div key={kpi.label} className={`relative rounded-xl border ${kpi.border} bg-white/[0.03] overflow-hidden`}>
                    <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${kpi.accent} pointer-events-none`} />
                    <div className="relative p-4 flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.iconBg)}>
                        <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
                      </div>
                      <div>
                        <p className={cn('text-xl font-black', kpi.textColor)}>{kpi.value}</p>
                        <p className="text-xs text-white/40">{kpi.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Distribution + Marketplace */}
            {stats && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex flex-col">
                  <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Distribuição de Notas</h3>
                    <span className="text-xl font-black text-amber-400">{stats.averageRating.toFixed(1)} ★</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-center space-y-3.5">
                    {([5,4,3,2,1] as const).map(r => (
                      <RatingBar key={r} rating={r} count={stats.byRating[r]} total={stats.total} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
                    <h3 className="text-sm font-semibold text-white">Por Marketplace</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {stats.byMarketplace.map(mp => {
                      const accent = MP_DARK[mp.marketplace] ?? { text: 'text-white/60', dot: 'bg-white/40', bar: 'bg-white/10 border-white/10', glow: 'from-white/5' }
                      const responded = mp.total - mp.pending
                      return (
                        <div
                          key={mp.marketplace}
                          className="relative overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition-all"
                        >
                          {/* subtle left glow */}
                          <div className={cn('pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent opacity-60', accent.glow)} />
                          <div className="relative flex items-center gap-3">
                            {/* Dot + name */}
                            <span className={cn('h-2 w-2 rounded-full shrink-0', accent.dot)} />
                            <span className={cn('text-xs font-bold w-28 shrink-0', accent.text)}>
                              {marketplaceConfig[mp.marketplace]?.label ?? mp.marketplace}
                            </span>

                            {/* Divider */}
                            <div className="h-4 w-px bg-white/[0.08] shrink-0" />

                            {/* Badges inline */}
                            <div className="flex items-center gap-2 flex-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-white/40">
                                {mp.total} total
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                                <Clock className="h-2.5 w-2.5" />{mp.pending} pendentes
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                                <CheckCircle2 className="h-2.5 w-2.5" />{responded} respondidos
                              </span>
                            </div>

                            {/* Rating */}
                            <span className="text-xs font-bold text-amber-400 shrink-0 ml-auto">
                              {mp.averageRating.toFixed(1)} ★
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, produto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
                <select
                  value={marketplace}
                  onChange={e => setMarketplace(e.target.value)}
                  className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                >
                  <option value="">Todos marketplaces</option>
                  <option value="mercadolivre">Mercado Livre</option>
                  <option value="shopee">Shopee</option>
                </select>
                <select
                  value={replied}
                  onChange={e => setReplied(e.target.value)}
                  className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                >
                  <option value="">Todos status</option>
                  <option value="false">Pendentes</option>
                  <option value="true">Respondidos</option>
                </select>
                <StarRatingFilter value={rating} onChange={setRating} />
              </div>
            </div>

            {/* Feedback list */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="h-12 w-12 text-white/10 mb-3" />
                <p className="text-sm font-medium text-white/40">Nenhum feedback encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map(fb => (
                  <div
                    key={fb.id}
                    className={cn(
                      'rounded-xl border bg-white/[0.03] hover:bg-white/[0.05] transition-all p-4',
                      !fb.replied ? 'border-orange-500/30' : 'border-white/[0.07]'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] font-semibold text-sm text-white/60">
                        {fb.customer.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{fb.customer}</span>
                          <MarketplaceBadge marketplace={fb.marketplace} size="xs" />
                          {fb.replied ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Respondido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                              <Clock className="h-3 w-3" /> Pendente
                            </span>
                          )}
                          <span className="ml-auto text-xs text-white/30">{formatTimeAgo(fb.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <StarDisplay rating={fb.rating} />
                          <span className="text-sm font-semibold text-white">{fb.title}</span>
                        </div>
                        <p className="text-xs text-white/50 mb-1.5 leading-relaxed">{fb.comment}</p>
                        <p className="text-[10px] text-white/25">Produto: {fb.product} · Pedido: {fb.orderId}</p>

                        {fb.replyText && (
                          <div className="mt-3 rounded-lg bg-blue-500/[0.08] border border-blue-500/20 p-3">
                            <p className="text-[10px] font-semibold text-blue-400 mb-1">Sua resposta:</p>
                            <p className="text-xs text-blue-300/80">{fb.replyText}</p>
                          </div>
                        )}

                        {replyingId === fb.id ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Escreva sua resposta ao cliente..."
                              rows={3}
                              autoFocus
                            />
                            <div className="flex flex-wrap gap-2 items-center">
                              <AiSuggestButton
                                onSuggestion={text => setReplyText(text)}
                                payload={{
                                  type: 'feedback',
                                  product: fb.product,
                                  marketplace: fb.marketplace,
                                  rating: fb.rating,
                                  title: fb.title,
                                  comment: fb.comment,
                                }}
                              />
                              <button
                                onClick={() => handleReply(fb.id)}
                                disabled={submitting || !replyText.trim()}
                                className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <Send className="h-3.5 w-3.5" />
                                {submitting ? 'Enviando...' : 'Enviar resposta'}
                              </button>
                              <button
                                onClick={() => { setReplyingId(null); setReplyText('') }}
                                className="h-8 rounded-lg border border-white/[0.08] px-3 text-xs text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : !fb.replied && (
                          <button
                            className="mt-2 inline-flex items-center gap-1.5 h-8 rounded-lg border border-primary/40 bg-primary/5 px-3 text-xs text-primary hover:bg-primary/15 hover:border-primary/60 transition-all font-medium"
                            onClick={() => { setReplyingId(fb.id); setReplyText('') }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Responder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-white/30">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} feedbacks
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="flex items-center px-3 text-sm font-medium text-white/60">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Perguntas tab ── */}
        {tab === 'perguntas' && <PerguntasTab />}
      </div>
    </div>
  )
}
