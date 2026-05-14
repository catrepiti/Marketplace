'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TrendingUp, TrendingDown, Megaphone, MousePointer,
  DollarSign, BarChart2, Eye, Target, Percent, ShoppingBag, ChevronDown,
  Building2, Users,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Header } from '@/components/layout/Header'
import { AdsMetrics } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'
import { MARKETPLACE_LIST, getMPByUpper } from '@/lib/marketplaces'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'

// ── Types ─────────────────────────────────────────────────────────────────────
type PlatformFilter = 'all' | string
type StatusFilter   = 'all' | 'active' | 'paused' | 'ended'

interface ClientInfo {
  id: string
  name: string
  activeMarketplaces: string[]
}

// Dark-mode accent map per marketplace
const MP_DARK: Record<string, { text: string; dot: string; glow: string; bar: string; border: string }> = {
  MERCADOLIVRE: { text: 'text-yellow-400', dot: 'bg-yellow-400', glow: 'from-yellow-500/10', bar: 'bg-yellow-400', border: 'border-yellow-500/20' },
  SHOPEE:       { text: 'text-orange-400', dot: 'bg-orange-400', glow: 'from-orange-500/10', bar: 'bg-orange-400', border: 'border-orange-500/20' },
  AMAZON:       { text: 'text-amber-400',  dot: 'bg-amber-400',  glow: 'from-amber-500/10',  bar: 'bg-amber-400',  border: 'border-amber-500/20'  },
  MAGALU:       { text: 'text-blue-400',   dot: 'bg-blue-400',   glow: 'from-blue-500/10',   bar: 'bg-blue-400',   border: 'border-blue-500/20'   },
  AMERICANAS:   { text: 'text-red-400',    dot: 'bg-red-400',    glow: 'from-red-500/10',    bar: 'bg-red-400',    border: 'border-red-500/20'    },
  CASASBAHIA:   { text: 'text-indigo-400', dot: 'bg-indigo-400', glow: 'from-indigo-500/10', bar: 'bg-indigo-400', border: 'border-indigo-500/20' },
}
const DEFAULT_MP = { text: 'text-white/60', dot: 'bg-white/40', glow: 'from-white/5', bar: 'bg-white/40', border: 'border-white/10' }

const periodOptions = [
  { value: '7',  label: '7 dias'  },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
]

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Ativa',      cls: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' },
  paused: { label: 'Pausada',    cls: 'bg-white/[0.06] border border-white/[0.08] text-white/50'        },
  ended:  { label: 'Encerrada',  cls: 'bg-red-500/10 border border-red-500/20 text-red-400'             },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(current: number, prev: number) {
  if (prev === 0) return 0
  return +((((current - prev) / prev) * 100).toFixed(1))
}
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
function acosColor(v: number) {
  if (v <= 15) return 'text-emerald-400'
  if (v <= 30) return 'text-amber-400'
  return 'text-red-400'
}
function tacosColor(v: number) {
  if (v <= 5)  return 'text-emerald-400'
  if (v <= 12) return 'text-amber-400'
  return 'text-red-400'
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DeltaBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  if (value === 0) return null
  const good = invert ? value < 0 : value > 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
      good ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    )}>
      {value > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

function MetricTooltip({ term, description }: { term: string; description: string }) {
  return (
    <span className="group relative inline-flex items-center cursor-help ml-1">
      <span className="h-3.5 w-3.5 rounded-full border border-white/20 text-[9px] font-bold text-white/30 flex items-center justify-center">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex w-52 flex-col gap-0.5 rounded-lg bg-[#0d1829] border border-white/[0.07] px-2.5 py-2 text-[10px] text-white/80 shadow-xl z-10">
        <strong className="text-white">{term}</strong>
        <span className="font-normal opacity-80">{description}</span>
      </span>
    </span>
  )
}

function SpendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#0d1829] p-2.5 shadow-xl text-xs space-y-1">
      <p className="font-medium text-white/60">{label}</p>
      {payload.map((p: any) => {
        const mp = MARKETPLACE_LIST.find(m => m.key === p.dataKey)
        return (
          <div key={p.dataKey} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-white/40">{mp?.label ?? p.dataKey}:</span>
            <span className="font-semibold text-white">{formatCurrency(p.value)}</span>
          </div>
        )
      })}
      <div className="border-t border-white/[0.05] pt-1 flex justify-between">
        <span className="text-white/40">Total</span>
        <span className="font-bold text-white">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnunciosPage() {
  const [metrics, setMetrics]         = useState<AdsMetrics | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [period, setPeriod]           = useState('30')
  const [platform, setPlatform]         = useState<PlatformFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch]             = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [clients, setClients]           = useState<ClientInfo[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !(prev[key] ?? true) }))

  // Fetch client list once
  useEffect(() => {
    fetch('/api/overview', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setClients(
        (d.clients ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          activeMarketplaces: c.activeMarketplaces ?? [],
        }))
      ))
      .catch(() => {})
  }, [])

  const initialLoad = useRef(true)

  const fetchMetrics = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const mp  = platform !== 'all' ? `&marketplace=${platform}` : ''
      const cli = selectedClient ? `&clientId=${selectedClient.id}` : ''
      const res = await fetch(`/api/anuncios?period=${period}${mp}${cli}`, { cache: 'no-store' })
      setMetrics(await res.json())
    } finally { setLoading(false); setRefreshing(false) }
  }, [period, platform, selectedClient])

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false
      setLoading(true)
      fetchMetrics()
    } else {
      // Filter change after first load — dim the content, don't blank it
      setRefreshing(true)
      fetchMetrics()
    }
  }, [fetchMetrics])

  if (loading) return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Anúncios" subtitle={selectedClient ? `Performance de campanhas · ${selectedClient.name}` : 'Performance de campanhas por plataforma'} />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-white/40">Carregando métricas…</p>
        </div>
      </div>
    </div>
  )
  if (!metrics) return null

  const prev = metrics.prevPeriod

  const visibleSpendMPs = MARKETPLACE_LIST.filter(mp =>
    (platform === 'all' || mp.keyUpper === platform) &&
    metrics.spendByDay.some(d => (d[mp.key] as number) > 0)
  )

  const filteredCampaigns = metrics.campaigns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group campaigns by marketplace for per-operation sections
  const campaignsByMP = MARKETPLACE_LIST
    .map(mp => ({
      mp,
      campaigns: filteredCampaigns.filter(c => c.marketplace === mp.keyUpper),
      mpData: metrics.byMarketplace.find(b => b.marketplace === mp.keyUpper),
    }))
    .filter(g => g.campaigns.length > 0)

  const kpiRow1 = [
    { icon: DollarSign,   label: 'Investimento total',  value: formatCurrency(metrics.totalSpend),     delta: pct(metrics.totalSpend, prev.totalSpend),       accent: 'from-violet-500/15 to-transparent', border: 'border-violet-500/20', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-400' },
    { icon: TrendingUp,   label: 'ROAS',                value: `${metrics.roas}x`,                     delta: pct(metrics.roas, prev.roas),                   accent: 'from-emerald-500/15 to-transparent', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', sub: 'Retorno sobre o gasto' },
    { icon: Eye,          label: 'Impressões',          value: fmt(metrics.totalImpressions),           delta: undefined,                                       accent: 'from-blue-500/15 to-transparent', border: 'border-blue-500/20', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { icon: MousePointer, label: 'Cliques',             value: fmt(metrics.totalClicks),                delta: pct(metrics.totalClicks, prev.totalClicks),     accent: 'from-cyan-500/15 to-transparent', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-400' },
  ]

  const kpiRow2 = [
    { icon: BarChart2, label: 'CTR médio',   value: `${metrics.ctr}%`,              delta: undefined,                                               sub: 'Cliques / Impressões', accent: 'from-amber-500/15 to-transparent', border: 'border-amber-500/20', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
    { icon: Target,    label: 'Conversões',  value: fmt(metrics.totalConversions),   delta: pct(metrics.totalConversions, prev.totalConversions),   sub: undefined,               accent: 'from-orange-500/15 to-transparent', border: 'border-orange-500/20', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-400' },
  ]

  return (
    <div className="relative flex flex-col flex-1 bg-[#060b14]">
      <Header
        title="Anúncios"
        subtitle={selectedClient ? `Performance de campanhas · ${selectedClient.name}` : 'Performance de campanhas por plataforma'}
        onRefresh={() => fetchMetrics(true)}
        refreshing={refreshing}
      />

      {refreshing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div className={cn('flex-1 overflow-y-auto p-6 space-y-6 transition-opacity duration-300', refreshing && 'opacity-40 pointer-events-none')}>

        {/* Controls */}
        <div className="space-y-2.5">
          {/* Row 1 — platform + period */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            {/* Platform pills */}
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-0.5">
              <button
                onClick={() => setPlatform('all')}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  platform === 'all' ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                )}
              >
                Todos
              </button>
              {MARKETPLACE_LIST.map(mp => (
                <button
                  key={mp.keyUpper}
                  onClick={() => setPlatform(mp.keyUpper)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    platform === mp.keyUpper
                      ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                      : cn('text-white/40 hover:text-white/70', mp.tailwind.text)
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', mp.tailwind.dot)} />
                  {mp.label}
                </button>
              ))}
            </div>
            {/* Period pills */}
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-0.5">
              {periodOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    period === opt.value
                      ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2 — Client selector */}
          {clients.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <Users className="h-3.5 w-3.5 text-white/30" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Cliente</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1" style={{ scrollbarWidth: 'none' }}>
                {/* Consolidado pill */}
                <button
                  onClick={() => setSelectedClient(null)}
                  className={cn(
                    'flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                    !selectedClient
                      ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm border-transparent'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                  )}
                >
                  <Building2 className="h-3 w-3 shrink-0" />
                  Consolidado
                </button>

                {/* One pill per client */}
                {clients.map(client => {
                  const isActive = selectedClient?.id === client.id
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(isActive ? null : client)}
                      className={cn(
                        'flex items-center gap-2 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                        isActive
                          ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm border-transparent'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                      )}
                    >
                      <span className="truncate max-w-[120px]">{client.name}</span>
                      {/* Marketplace dots */}
                      <span className="flex items-center gap-0.5 shrink-0">
                        {client.activeMarketplaces.slice(0, 4).map(mpKey => {
                          const accent = MP_DARK[mpKey.toUpperCase()] ?? DEFAULT_MP
                          return <span key={mpKey} className={cn('h-1.5 w-1.5 rounded-full', accent.dot)} />
                        })}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* KPI grid — 4 cols × 2 rows, compact horizontal cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...kpiRow1, ...kpiRow2].map(kpi => (
            <div
              key={kpi.label}
              className={`relative flex items-center gap-3 rounded-xl border ${kpi.border} bg-white/[0.03] overflow-hidden hover:bg-white/[0.05] transition-all duration-200 p-3.5`}
            >
              <div className={`absolute inset-y-0 left-0 w-28 bg-gradient-to-r ${kpi.accent} pointer-events-none opacity-60`} />
              <div className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', kpi.iconBg)}>
                <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 truncate">{kpi.label}</p>
                  {kpi.delta !== undefined && <DeltaBadge value={kpi.delta} />}
                </div>
                <p className="text-xl font-black text-white leading-tight tracking-tight">{kpi.value}</p>
                {kpi.sub && <p className="text-[10px] text-white/25 mt-0.5 truncate">{kpi.sub}</p>}
              </div>
            </div>
          ))}

          {/* ACOS */}
          <div className="relative flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] overflow-hidden hover:bg-primary/[0.07] transition-all duration-200 p-3.5">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-primary/15 to-transparent pointer-events-none opacity-60" />
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Percent className="h-4 w-4 text-primary" />
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 flex items-center gap-0.5">
                  ACOS <MetricTooltip term="ACOS — Advertising Cost of Sale" description="Quanto você gasta em anúncios para cada R$100 de receita publicitária. Ideal: abaixo de 20%." />
                </p>
                <DeltaBadge value={pct(metrics.acos, prev.acos)} invert />
              </div>
              <p className={cn('text-xl font-black leading-tight', acosColor(metrics.acos))}>{metrics.acos}%</p>
              <p className="text-[10px] text-white/25 mt-0.5">Gasto / Receita ads</p>
            </div>
          </div>

          {/* TACOS */}
          <div className="relative flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] overflow-hidden hover:bg-primary/[0.07] transition-all duration-200 p-3.5">
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-primary/15 to-transparent pointer-events-none opacity-60" />
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 flex items-center gap-0.5">
                  TACOS <MetricTooltip term="TACOS — Total Advertising Cost of Sale" description="Custo de anúncio sobre a receita total (orgânica + paga). Ideal: abaixo de 8%." />
                </p>
                <DeltaBadge value={pct(metrics.tacos, prev.tacos)} invert />
              </div>
              <p className={cn('text-xl font-black leading-tight', tacosColor(metrics.tacos))}>{metrics.tacos}%</p>
              <p className="text-[10px] text-white/25 mt-0.5">Gasto / Receita total</p>
            </div>
          </div>
        </div>

        {/* Spend chart + Platform cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Chart — stretches to match right col height */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center gap-2 shrink-0">
              <BarChart2 className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white">Investimento diário</h3>
            </div>
            <div className="flex-1 min-h-[300px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.spendByDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    {visibleSpendMPs.map(mp => (
                      <linearGradient key={mp.key} id={`spendGrad-${mp.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={mp.chartColor} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={mp.chartColor} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label"
                    ticks={metrics.spendByDay.filter((_, i) => i % Math.ceil(metrics.spendByDay.length / 6) === 0).map(d => d.label)}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `R$${v}`}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<SpendTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: 'rgba(255,255,255,0.4)' }} formatter={v => MARKETPLACE_LIST.find(m => m.key === v)?.label ?? v} />
                  {visibleSpendMPs.map(mp => (
                    <Area key={mp.key} type="monotone" dataKey={mp.key} name={mp.key}
                      stroke={mp.chartColor} strokeWidth={2} fill={`url(#spendGrad-${mp.key})`} dot={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform breakdown cards */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[640px] pr-0.5">
            {metrics.byMarketplace.map(mp => {
              const def    = getMPByUpper(mp.marketplace)
              const accent = MP_DARK[mp.marketplace] ?? DEFAULT_MP
              return (
                <div
                  key={mp.marketplace}
                  className={cn('relative rounded-xl border overflow-hidden bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200', accent.border)}
                >
                  {/* top gradient */}
                  <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent opacity-70', accent.glow)} />

                  {/* Header */}
                  <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('h-2 w-2 rounded-full', accent.dot)} />
                      <span className="text-base leading-none">{def.connect.logo}</span>
                      <p className={cn('text-sm font-bold', accent.text)}>{def.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', `bg-white/[0.04] border-white/[0.08] ${accent.text}`)}>
                        ROAS {mp.roas}x
                      </span>
                    </div>
                  </div>

                  {/* Metrics grid 2-col */}
                  <div className="relative px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {[
                      { label: 'Investimento',   value: formatCurrency(mp.spend)      },
                      { label: 'Receita ads',    value: formatCurrency(mp.revenue)    },
                      { label: 'Impressões',     value: fmt(mp.impressions)           },
                      { label: 'Cliques',        value: fmt(mp.clicks)                },
                      { label: 'CTR',            value: `${mp.ctr}%`                  },
                      { label: 'CPC médio',      value: formatCurrency(mp.cpc)        },
                      { label: 'Conversões',     value: String(mp.conversions)        },
                      { label: 'Receita total',  value: formatCurrency(mp.totalRevenue) },
                    ].map(row => (
                      <div key={row.label} className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-white/30 uppercase tracking-wide">{row.label}</span>
                        <span className="text-xs font-semibold text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ACOS / TACOS footer */}
                  <div className="relative flex items-center gap-0 border-t border-white/[0.05]">
                    <div className="flex-1 flex items-center justify-between px-4 py-2.5 border-r border-white/[0.05]">
                      <span className="text-[11px] font-medium text-white/40 flex items-center">
                        ACOS <MetricTooltip term="ACOS" description="Custo de anúncio / Receita de ads × 100" />
                      </span>
                      <span className={cn('text-sm font-black', acosColor(mp.acos))}>{mp.acos}%</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between px-4 py-2.5">
                      <span className="text-[11px] font-medium text-white/40 flex items-center">
                        TACOS <MetricTooltip term="TACOS" description="Custo de anúncio / Receita total × 100" />
                      </span>
                      <span className={cn('text-sm font-black', tacosColor(mp.tacos))}>{mp.tacos}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Campanhas por operação ── */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Megaphone className="h-4 w-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white">Campanhas por Operação</h3>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {filteredCampaigns.length}
                </span>
                {selectedClient && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] px-2.5 py-0.5 text-[10px] font-semibold text-white/60">
                    <Building2 className="h-3 w-3" />
                    {selectedClient.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar campanha…"
                  className="h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50 w-44 transition-all"
                />
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
                  {(['all', 'active', 'paused', 'ended'] as StatusFilter[]).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                        statusFilter === s ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                      )}
                    >
                      {{ all: 'Todas', active: 'Ativas', paused: 'Pausadas', ended: 'Encerradas' }[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* One section per marketplace */}
          {campaignsByMP.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/30">
              <Megaphone className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Nenhuma campanha encontrada</p>
            </div>
          ) : campaignsByMP.map(({ mp, campaigns: mpCampaigns, mpData }) => {
            const accent   = MP_DARK[mp.keyUpper] ?? DEFAULT_MP
            const isOpen   = openSections[mp.key] ?? true
            const totSpend = mpCampaigns.reduce((s, c) => s + c.spend, 0)
            const totRev   = mpCampaigns.reduce((s, c) => s + c.revenue, 0)
            const sectionRoas = totSpend > 0 ? (totRev / totSpend).toFixed(2) : '—'
            const sectionAcos = totRev   > 0 ? ((totSpend / totRev) * 100).toFixed(1) : '—'

            return (
              <div key={mp.key} className={cn('rounded-xl border overflow-hidden', accent.border)}>
                {/* Section header — clickable to collapse */}
                <button
                  onClick={() => toggleSection(mp.key)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left"
                >
                  {/* Accent dot + logo + name */}
                  <span className={cn('h-2 w-2 rounded-full shrink-0', accent.dot)} />
                  <span className="text-lg leading-none">{mp.connect.logo}</span>
                  <span className={cn('text-sm font-bold', accent.text)}>{mp.label}</span>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 ml-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-white/40">
                      {mpCampaigns.length} campanha{mpCampaigns.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] text-white/30">Invest. <span className="font-semibold text-white/70">{formatCurrency(totSpend)}</span></span>
                    <span className="text-[11px] text-white/30">ROAS <span className={cn('font-bold', Number(sectionRoas) >= 3 ? 'text-emerald-400' : Number(sectionRoas) >= 1.5 ? 'text-amber-400' : 'text-red-400')}>{sectionRoas !== '—' ? `${sectionRoas}x` : '—'}</span></span>
                    <span className="text-[11px] text-white/30">ACOS <span className={cn('font-bold', sectionAcos !== '—' ? acosColor(Number(sectionAcos)) : 'text-white/30')}>{sectionAcos !== '—' ? `${sectionAcos}%` : '—'}</span></span>
                    {mpData && (
                      <span className="text-[11px] text-white/30">TACOS <span className={cn('font-bold', tacosColor(mpData.tacos))}>{mpData.tacos}%</span></span>
                    )}
                  </div>

                  <ChevronDown className={cn('h-4 w-4 text-white/30 ml-auto shrink-0 transition-transform duration-200', !isOpen && '-rotate-90')} />
                </button>

                {/* Campaigns table */}
                {isOpen && (
                  <div className="overflow-x-auto border-t border-white/[0.05]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                          {['Campanha', 'Tipo', 'Status', 'Impressões', 'Cliques', 'CTR', 'Invest.', 'CPC', 'Conv.', 'Receita', 'ROAS', 'ACOS', 'TACOS'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {mpCampaigns.map(c => {
                          const ctr  = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0'
                          const cpc  = c.clicks > 0 ? (c.spend / c.clicks).toFixed(2) : '0'
                          const roas = c.spend > 0  ? (c.revenue / c.spend).toFixed(2) : '0'
                          const acos = c.revenue > 0 ? ((c.spend / c.revenue) * 100).toFixed(1) : '—'
                          const tacos = mpData && mpData.totalRevenue > 0
                            ? ((c.spend / mpData.totalRevenue) * 100).toFixed(2) : '—'
                          const st = STATUS_MAP[c.status]
                          return (
                            <tr key={c.id} className="hover:bg-white/[0.025] transition-colors">
                              <td className="px-3 py-2.5 font-medium text-white max-w-[200px] truncate">{c.name}</td>
                              <td className="px-3 py-2.5 text-white/40">{c.type}</td>
                              <td className="px-3 py-2.5">
                                <span className={cn('rounded-full px-2 py-0.5 font-semibold text-[10px]', st.cls)}>{st.label}</span>
                              </td>
                              <td className="px-3 py-2.5 text-white/50">{fmt(c.impressions)}</td>
                              <td className="px-3 py-2.5 text-white/50">{fmt(c.clicks)}</td>
                              <td className="px-3 py-2.5 text-white/50">{ctr}%</td>
                              <td className="px-3 py-2.5 font-semibold text-white">{formatCurrency(c.spend)}</td>
                              <td className="px-3 py-2.5 text-white/50">R${cpc}</td>
                              <td className="px-3 py-2.5 text-white/50">{c.conversions}</td>
                              <td className="px-3 py-2.5 font-semibold text-white">{formatCurrency(c.revenue)}</td>
                              <td className="px-3 py-2.5">
                                <span className={cn('font-bold', Number(roas) >= 3 ? 'text-emerald-400' : Number(roas) >= 1.5 ? 'text-amber-400' : 'text-red-400')}>{roas}x</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={cn('font-semibold', acos !== '—' ? acosColor(Number(acos)) : 'text-white/30')}>{acos !== '—' ? `${acos}%` : '—'}</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={cn('font-semibold', tacos !== '—' ? tacosColor(Number(tacos)) : 'text-white/30')}>{tacos !== '—' ? `${tacos}%` : '—'}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>

                      {/* Section totals row */}
                      <tfoot>
                        <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                          <td className="px-3 py-2.5 text-[10px] font-bold text-white/40 uppercase tracking-wide" colSpan={6}>Total {mp.label}</td>
                          <td className="px-3 py-2.5 font-black text-white text-xs">{formatCurrency(totSpend)}</td>
                          <td className="px-3 py-2.5" />
                          <td className="px-3 py-2.5 font-semibold text-white/60 text-xs">{mpCampaigns.reduce((s, c) => s + c.conversions, 0)}</td>
                          <td className="px-3 py-2.5 font-black text-white text-xs">{formatCurrency(totRev)}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn('font-black text-xs', Number(sectionRoas) >= 3 ? 'text-emerald-400' : Number(sectionRoas) >= 1.5 ? 'text-amber-400' : 'text-red-400')}>{sectionRoas !== '—' ? `${sectionRoas}x` : '—'}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={cn('font-black text-xs', sectionAcos !== '—' ? acosColor(Number(sectionAcos)) : 'text-white/30')}>{sectionAcos !== '—' ? `${sectionAcos}%` : '—'}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            {mpData && <span className={cn('font-black text-xs', tacosColor(mpData.tacos))}>{mpData.tacos}%</span>}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
