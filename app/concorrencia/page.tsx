'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TrendingDown, TrendingUp, Minus, RefreshCw, Sparkles,
  Target, AlertTriangle, CheckCircle2, Zap, ChevronDown,
  Swords, ShieldCheck, Trophy, TrendingUp as Grow,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import {
  CompetitorReport, CompetitorProduct, PricePosition,
  StrategyType, WinStrategy, PRODUCT_CATEGORIES,
} from '@/lib/mock/competitor-generator'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 5) return 'agora mesmo'
  if (s < 60) return `${s}s atrás`
  return `${Math.floor(s / 60)}min atrás`
}

const POSITION_CFG: Record<PricePosition, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  cheapest:       { label: 'Mais Barato',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: TrendingDown },
  below_avg:      { label: 'Abaixo Média', color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20',   icon: TrendingDown },
  on_avg:         { label: 'Na Média',     color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: Minus },
  above_avg:      { label: 'Acima Média',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  icon: TrendingUp },
  most_expensive: { label: 'Mais Caro',    color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: TrendingUp },
}

const STRATEGY_CFG: Record<StrategyType, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  price_attack:  { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: Swords     },
  value_capture: { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: Grow       },
  dominate:      { color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: Trophy     },
  defend_hold:   { color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   icon: ShieldCheck },
}

const PRIORITY_CFG = {
  urgent:   { label: 'Urgente',     color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    dot: 'bg-red-500'    },
  high:     { label: 'Alto',        color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  medium:   { label: 'Médio',       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   dot: 'bg-blue-500'   },
}

// ── Price Ladder ──────────────────────────────────────────────────────────────
function PriceLadder({ yourPrice, minMarket, maxMarket, targetPrice }: {
  yourPrice: number; minMarket: number; maxMarket: number; targetPrice: number | null
}) {
  const range = maxMarket - minMarket || 1
  const yourPct   = Math.max(0, Math.min(100, ((yourPrice   - minMarket) / range) * 100))
  const targetPct = targetPrice != null ? Math.max(0, Math.min(100, ((targetPrice - minMarket) / range) * 100)) : null

  return (
    <div className="mt-3 mb-1">
      <div className="flex justify-between text-[10px] text-white/40 mb-1">
        <span className="num">{fmt(minMarket)}</span>
        <span className="text-[10px] font-medium text-white/30">Escala de preços do mercado</span>
        <span className="num">{fmt(maxMarket)}</span>
      </div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-500/40 via-amber-500/40 to-red-500/40">
        {/* Your price pin */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${yourPct}%` }}
        >
          <div className="h-4 w-4 rounded-full border-2 border-white/20 bg-primary shadow-md shadow-primary/30 z-10" />
          <span className="mt-1 text-[9px] font-bold text-primary whitespace-nowrap">Você</span>
        </div>
        {/* Target price pin */}
        {targetPct != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${targetPct}%` }}
          >
            <div className="h-4 w-4 rounded-full border-2 border-white/20 bg-emerald-500 shadow-md shadow-emerald-500/30 z-10" />
            <span className="mt-1 text-[9px] font-bold text-emerald-400 whitespace-nowrap">Meta</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Win Strategy Panel ────────────────────────────────────────────────────────
function WinStrategyPanel({ strategy, product }: { strategy: WinStrategy; product: CompetitorProduct }) {
  const cfg = STRATEGY_CFG[strategy.type]
  const Icon = cfg.icon

  return (
    <div className={cn('rounded-xl border p-4 space-y-4', cfg.bg, cfg.border)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', cfg.bg, cfg.border)}>
          <Icon className={cn('h-5 w-5', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-xs font-bold rounded-full px-2.5 py-0.5 border', cfg.bg, cfg.color, cfg.border)}>
              {strategy.badge}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-white/40">Probabilidade de vitória:</span>
              <span className={cn('num text-[11px] font-bold', strategy.winProbability >= 75 ? 'text-emerald-400' : strategy.winProbability >= 50 ? 'text-amber-400' : 'text-red-400')}>
                {strategy.winProbability}%
              </span>
            </div>
          </div>
          <p className={cn('text-sm font-bold', cfg.color)}>{strategy.headline}</p>
          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{strategy.summary}</p>
        </div>
      </div>

      {/* Price ladder */}
      <PriceLadder
        yourPrice={product.yourPrice}
        minMarket={product.minMarket}
        maxMarket={product.maxMarket}
        targetPrice={strategy.targetPrice}
      />

      {/* Impact metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] p-2.5 text-center">
          <p className="text-[10px] text-white/40">Preço alvo</p>
          <p className={cn('num text-sm font-bold mt-0.5', cfg.color)}>
            {strategy.targetPrice ? fmt(strategy.targetPrice) : 'Manter'}
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] p-2.5 text-center">
          <p className="text-[10px] text-white/40">Volume extra/mês</p>
          <p className={cn('num text-sm font-bold mt-0.5', strategy.estimatedVolumeGain > 0 ? 'text-emerald-400' : 'text-orange-400')}>
            {strategy.estimatedVolumeGain > 0 ? '+' : ''}{strategy.estimatedVolumeGain} un
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] p-2.5 text-center">
          <p className="text-[10px] text-white/40">Receita adicional</p>
          <p className={cn('num text-sm font-bold mt-0.5', strategy.estimatedRevenueGain > 0 ? 'text-emerald-400' : 'text-orange-400')}>
            {strategy.estimatedRevenueGain > 0 ? '+' : ''}{fmt(strategy.estimatedRevenueGain)}
          </p>
        </div>
      </div>

      {/* Step by step battle plan */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/30 mb-2">Plano de Ação</p>
        <div className="space-y-2">
          {strategy.steps.map((step, i) => {
            const p = PRIORITY_CFG[step.priority]
            return (
              <div key={i} className="flex items-start gap-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5">
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0 mt-0.5', p.dot)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn('text-[10px] font-bold rounded-full px-1.5 py-0.5 border', p.bg, p.color, p.border)}>
                      {p.label}
                    </span>
                    <p className="text-xs font-semibold text-white">{step.action}</p>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Competitor comparison */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/30 mb-2">Concorrentes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-2.5">
            <p className="text-[10px] font-bold text-primary">Você</p>
            <p className="num text-sm font-bold text-white">{fmt(product.yourPrice)}</p>
            <p className="text-[10px] text-white/40">{product.yourSales} vend/mês</p>
          </div>
          {product.competitors.map((c, i) => (
            <div key={i} className={cn('rounded-lg border p-2.5',
              c.price < product.yourPrice ? 'border-red-500/20 bg-red-500/5' :
              c.price > product.yourPrice ? 'border-emerald-500/20 bg-emerald-500/5' :
              'border-white/[0.07] bg-white/[0.03]')}>
              <p className="text-[10px] font-semibold text-white/40 truncate">{c.name}</p>
              <p className={cn('num text-sm font-bold', c.price < product.yourPrice ? 'text-red-400' : c.price > product.yourPrice ? 'text-emerald-400' : 'text-white')}>
                {fmt(c.price)}
              </p>
              <p className="text-[10px] text-white/40">★ {c.rating} · {c.sales}/mês</p>
              {c.freeShipping && <p className="text-[10px] text-emerald-400 font-medium">Frete grátis</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Product Row ───────────────────────────────────────────────────────────────
function ProductRow({ product }: { product: CompetitorProduct }) {
  const [open, setOpen] = useState(false)
  const pos = POSITION_CFG[product.position]
  const PosIcon = pos.icon
  const strat = STRATEGY_CFG[product.winStrategy.type]

  return (
    <>
      <tr
        className="border-b border-white/[0.05] hover:bg-white/[0.03] cursor-pointer transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-[200px]">{product.name}</p>
            <p className="text-[10px] text-white/40">{product.sku} · {product.category}</p>
          </div>
        </td>
        <td className="px-3 py-3">
          <MarketplaceBadge marketplace={product.marketplace} size="xs" />
        </td>
        <td className="num px-3 py-3 text-right font-bold text-white">{fmt(product.yourPrice)}</td>
        <td className="num px-3 py-3 text-right text-white/40 text-xs">{fmt(product.avgMarket)}</td>
        <td className="num px-3 py-3 text-right">
          <span className={cn('text-xs font-bold', product.priceDiff > 8 ? 'text-red-400' : product.priceDiff > 0 ? 'text-orange-400' : 'text-emerald-400')}>
            {product.priceDiff > 0 ? '+' : ''}{product.priceDiff}%
          </span>
        </td>
        <td className="px-3 py-3">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border', pos.bg, pos.color, pos.border)}>
            <PosIcon className="h-3 w-3" /> {pos.label}
          </span>
        </td>
        <td className="px-3 py-3">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border', strat.bg, strat.color, strat.border)}>
            {product.winStrategy.badge}
          </span>
        </td>
        <td className="num px-3 py-3 text-right">
          {product.estimatedGainIfOptimized > 0 && (
            <span className="text-xs font-bold text-emerald-400">+{fmt(product.estimatedGainIfOptimized)}</span>
          )}
        </td>
        <td className="px-3 py-3">
          <ChevronDown className={cn('h-4 w-4 text-white/30 transition-transform', open && 'rotate-180')} />
        </td>
      </tr>
      {open && (
        <tr className="border-b border-white/[0.05]">
          <td colSpan={9} className="px-4 py-4 bg-white/[0.02]">
            <WinStrategyPanel strategy={product.winStrategy} product={product} />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const r = 28; const c = 2 * Math.PI * r; const off = c - (score / 100) * c
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="6" fill="none" className="text-white/[0.08]" />
        <circle cx="40" cy="40" r={r} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <span className="absolute text-lg font-bold text-white">{score}</span>
    </div>
  )
}

// ── AI Panel ──────────────────────────────────────────────────────────────────
function AiPanel({ report, onClose }: { report: CompetitorReport; onClose: () => void }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState('')
  const abort = useRef<AbortController | null>(null)

  const run = useCallback(async (g?: string) => {
    setLoading(true); setText('')
    abort.current?.abort()
    abort.current = new AbortController()
    try {
      const res = await fetch('/api/ai/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, monthlyGoal: g ? Number(g.replace(/\D/g,'')) : undefined, period: 'Maio 2026' }),
        signal: abort.current.signal,
      })
      const reader = res.body?.getReader(); if (!reader) return
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6); if (d === '[DONE]') break
          try { const j = JSON.parse(d); if (j.text) setText(p => p + j.text) } catch {}
        }
      }
    } finally { setLoading(false) }
  }, [report])

  useEffect(() => { run() }, [run])

  function render(t: string) {
    return t.split('\n').map((line, i) => {
      if (line.startsWith('## '))  return <h2 key={i} className="text-sm font-bold text-white mt-4 mb-1">{line.slice(3)}</h2>
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-xs font-bold text-white mt-2">{line.slice(2,-2)}</p>
      if (line.match(/^\*\*.*\*\*/)) return <p key={i} className="text-xs leading-relaxed text-white/70" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g,'<strong class="text-white">$1</strong>') }} />
      if (line.startsWith('- ')) return <li key={i} className="text-xs ml-4 list-disc leading-relaxed text-white/70">{line.slice(2)}</li>
      if (line.match(/^\d\./)) return <p key={i} className="text-xs font-semibold text-white mt-2">{line}</p>
      if (!line.trim()) return <div key={i} className="h-1" />
      return <p key={i} className="text-xs leading-relaxed text-white/70">{line}</p>
    })
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Análise Estratégica com IA</p>
              <p className="text-[11px] text-white/40">Diagnóstico executivo + recomendações para suas metas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                <Input
                  placeholder="Meta mensal (R$)"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  className="h-7 text-xs w-36 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl"
                />
                <button
                  onClick={() => run(goal)}
                  className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg bg-gradient-to-r from-primary to-blue-400 text-white hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="h-3 w-3" /> Reanalisar
                </button>
              </>
            )}
            <button onClick={onClose} className="text-white/30 hover:text-white text-lg px-1 leading-none">×</button>
          </div>
        </div>
      </div>
      <div className="p-4">
        {loading && !text && (
          <div className="flex items-center gap-2 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            <span className="text-xs text-white/40">Analisando estratégias de mercado...</span>
          </div>
        )}
        <div className="space-y-0.5">{render(text)}{loading && text && <span className="inline-block h-3.5 w-0.5 bg-violet-400 animate-pulse ml-0.5" />}</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ConcorrenciaPage() {
  const [report,  setReport]  = useState<CompetitorReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [category, setCategory] = useState('all')
  const [showAi,   setShowAi]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [stratFilter, setStratFilter] = useState<string>('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchReport = useCallback(async (spin = false) => {
    if (spin) setRefreshing(true)
    try {
      const res  = await fetch(`/api/concorrencia?category=${category}`, { cache: 'no-store' })
      const data = await res.json()
      setReport(data); setLastUpdated(new Date())
    } finally { setLoading(false); setRefreshing(false) }
  }, [category])

  useEffect(() => { setLoading(true); setShowAi(false); fetchReport() }, [fetchReport])
  useEffect(() => { timer.current = setInterval(() => fetchReport(), 60_000); return () => { if (timer.current) clearInterval(timer.current) } }, [fetchReport])

  const filtered = report?.products.filter(p => !stratFilter || p.winStrategy.type === stratFilter) ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Análise de Concorrência" subtitle="Inteligência de preços e plano de vitória por produto" onRefresh={() => fetchReport(true)} refreshing={refreshing} />

      <div className="flex-1 p-6 space-y-5">

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Ao vivo · {lastUpdated ? `Atualizado ${timeAgo(lastUpdated.toISOString())}` : 'Carregando...'}
            </div>
            <div className="h-4 w-px bg-white/[0.07]" />
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                    category === cat
                      ? 'bg-gradient-to-r from-primary to-blue-400 text-white'
                      : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-white/[0.08]'
                  )}>
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>
          {!showAi && (
            <button
              onClick={() => setShowAi(true)}
              className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-semibold rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" /> Analisar com IA
            </button>
          )}
        </div>

        {/* AI Panel */}
        {showAi && report && <AiPanel report={report} onClose={() => setShowAi(false)} />}

        {/* KPIs */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="h-16 bg-white/[0.05] animate-pulse rounded-lg" />
              </div>
            ))}
          </div>
        ) : report && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Score competitivo */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-blue-500/10 to-transparent" />
              <div className="relative flex items-center gap-4">
                <ScoreRing score={report.overallScore} />
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Score Competitivo</p>
                  <p className="text-sm font-semibold text-white">
                    {report.overallScore >= 70 ? 'Muito competitivo' : report.overallScore >= 40 ? 'Razoável' : 'Atenção necessária'}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5">{report.products.filter(p => p.position === 'cheapest' || p.position === 'below_avg').length} produtos abaixo da média</p>
                </div>
              </div>
            </div>

            {/* Receita potencial */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-500/10 to-transparent" />
              <div className="relative">
                <p className="text-xs text-white/40 mb-2">Receita Potencial</p>
                <p className="num text-2xl font-black text-emerald-400">+{fmt(report.totalOpportunity)}</p>
                <p className="text-[11px] text-white/40 mt-1">/mês com todos os ajustes</p>
              </div>
            </div>

            {/* Estratégias ativas */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-violet-500/10 to-transparent" />
              <div className="relative">
                <p className="text-xs text-white/40 mb-3">Estratégias ativas</p>
                <div className="space-y-1.5">
                  {[
                    { type: 'price_attack',  label: 'Atacar Preço',    color: 'text-red-400'    },
                    { type: 'value_capture', label: 'Capturar Margem', color: 'text-blue-400'   },
                    { type: 'dominate',      label: 'Dominar',         color: 'text-violet-400' },
                    { type: 'defend_hold',   label: 'Defender',        color: 'text-slate-400'  },
                  ].map(s => (
                    <div key={s.type} className="flex items-center justify-between">
                      <span className={cn('text-[11px] font-medium', s.color)}>{s.label}</span>
                      <span className="num text-[11px] font-bold text-white">{report.products.filter(p => p.winStrategy.type === s.type).length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Por categoria */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-500/10 to-transparent" />
              <div className="relative">
                <p className="text-xs text-white/40 mb-3">Por Categoria</p>
                <div className="space-y-2">
                  {report.categories.map(c => (
                    <div key={c.category} className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className={cn('h-full rounded-full', c.avgPositionScore >= 70 ? 'bg-emerald-500' : c.avgPositionScore >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${c.avgPositionScore}%` }} />
                      </div>
                      <span className="num text-[10px] font-bold text-white w-6 text-right">{c.avgPositionScore}</span>
                      <span className="text-[10px] text-white/40 truncate max-w-[80px]">{c.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy filter chips */}
        {report && (
          <div className="flex flex-wrap gap-2">
            {[
              { key: '',             label: 'Todas estratégias',  count: report.products.length },
              { key: 'price_attack', label: 'Atacar Preço',       count: report.products.filter(p => p.winStrategy.type === 'price_attack').length  },
              { key: 'value_capture',label: 'Capturar Margem',    count: report.products.filter(p => p.winStrategy.type === 'value_capture').length  },
              { key: 'dominate',     label: 'Dominar',            count: report.products.filter(p => p.winStrategy.type === 'dominate').length       },
              { key: 'defend_hold',  label: 'Defender',           count: report.products.filter(p => p.winStrategy.type === 'defend_hold').length    },
            ].map(f => (
              <button key={f.key} onClick={() => setStratFilter(f.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                  stratFilter === f.key
                    ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                    : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-white/[0.08]'
                )}>
                {f.label}
                {f.count > 0 && (
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', stratFilter === f.key ? 'bg-white/20' : 'bg-white/10')}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Products table */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{filtered.length} produtos monitorados</h2>
              <p className="text-[11px] text-white/30">Clique para expandir o plano de vitória</p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Produto</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Canal</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Seu Preço</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Média</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Dif.</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Posição</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Estratégia</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Potencial</th>
                    <th className="px-2 py-2.5 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => <ProductRow key={p.id} product={p} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
