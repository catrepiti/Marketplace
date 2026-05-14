'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Search, SlidersHorizontal, Calendar, AlertTriangle, X,
  ExternalLink, ChevronRight, TrendingUp, TrendingDown,
  ChevronUp, UserPlus,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { ClientOverview } from '@/lib/mock/client-generator'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Totals {
  clients: number
  gmv: number
  orders: number
  adSpend: number
  products: number
  avgRoas: number
}
interface OverviewData {
  clients: ClientOverview[]
  totals: Totals
}

type SortBy = 'gmv' | 'adSpend' | 'trend' | 'name'
type SortDir = 'asc' | 'desc'

// ── Formatters ─────────────────────────────────────────────────────────────────
function fmtBR(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtCompact(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(2).replace('.', ',')}K`
  return `R$ ${fmtBR(n)}`
}

// ── Date helpers ───────────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function fmtDMY(ymd: string): string {
  const [y, m, dd] = ymd.split('-')
  return `${dd}/${m}/${y}`
}

// ── Sparkline ──────────────────────────────────────────────────────────────────
function Sparkline({ data, color, uid }: { data: number[]; color: string; uid: string }) {
  if (data.length < 2) return null
  const W = 300
  const H = 56
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - 4 - ((v - min) / range) * (H - 8)
    return [x, y] as [number, number]
  })
  const linePath = 'M ' + pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')
  const areaPath = `M 0,${H} L ${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')} L ${W},${H} Z`
  const gid = `sg-${uid}`
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Trend badge ────────────────────────────────────────────────────────────────
function TrendBadge({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
      up ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
    )}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function VisaoGeralPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const myClientId = (session?.user as any)?.clientId

  const [data, setData]               = useState<OverviewData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [clientAutoFiltered, setClientAutoFiltered] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // Date range
  const todayYMD = toYMD(new Date())
  const thirtyAgo = toYMD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [dateFrom, setDateFrom]       = useState(thirtyAgo)
  const [dateTo, setDateTo]           = useState(todayYMD)
  const [pendingFrom, setPendingFrom] = useState(thirtyAgo)
  const [pendingTo, setPendingTo]     = useState(todayYMD)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Filters
  const [showFilters, setShowFilters]   = useState(false)
  const [minRevenue, setMinRevenue]     = useState(0)
  const [minInvestment, setMinInvestment] = useState(0)
  const [sortBy, setSortBy]             = useState<SortBy>('gmv')
  const [sortDir, setSortDir]           = useState<SortDir>('desc')

  const datePickerRef = useRef<HTMLDivElement>(null)
  const filtersRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/overview')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Auto-filter for CLIENT role
  useEffect(() => {
    if (!data || clientAutoFiltered) return
    if (role === 'CLIENT' && myClientId) {
      setSearch('')
      setClientAutoFiltered(true)
    }
  }, [data, session, role, myClientId, clientAutoFiltered])

  // Close panels on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Per-client filtered metrics (recalculated on every date change)
  const clientsWithFiltered = useMemo(() => {
    if (!data?.clients) return []
    // CLIENT role: only show their own store
    const source = (role === 'CLIENT' && myClientId)
      ? data.clients.filter(c => c.id === myClientId)
      : data.clients
    return source.map(c => {
      const days        = c.revenueByDay.filter(d => d.date >= dateFrom && d.date <= dateTo)
      const filteredGmv = days.reduce((s, d) => s + d.revenue, 0)
      const ratio       = c.gmv > 0 ? filteredGmv / c.gmv : 0
      const filteredAdSpend  = c.adSpend * ratio
      const filteredOrders   = Math.round(c.orders * ratio)
      const filteredRoas     = filteredAdSpend > 0 ? filteredGmv / filteredAdSpend : 0
      const filteredPct      = filteredGmv > 0 ? (filteredAdSpend / filteredGmv) * 100 : 0
      const filteredConvCusto = filteredOrders / Math.max(filteredAdSpend / 1000, 0.01)
      return { ...c, filteredGmv, filteredAdSpend, filteredOrders, filteredRoas, filteredPct, filteredConvCusto }
    })
  }, [data, dateFrom, dateTo, role, myClientId])

  // Sort/filter clients using filtered values
  const sorted = useMemo(() => {
    if (!clientsWithFiltered.length) return []
    let list = clientsWithFiltered
      .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
      .filter(c => c.filteredGmv >= minRevenue)
      .filter(c => c.filteredAdSpend >= minInvestment)
    list = [...list].sort((a, b) => {
      let diff = 0
      if (sortBy === 'gmv')          diff = a.filteredGmv - b.filteredGmv
      else if (sortBy === 'adSpend') diff = a.filteredAdSpend - b.filteredAdSpend
      else if (sortBy === 'trend')   diff = a.trend - b.trend
      else if (sortBy === 'name')    diff = a.name.localeCompare(b.name)
      return sortDir === 'desc' ? -diff : diff
    })
    return list
  }, [clientsWithFiltered, search, minRevenue, minInvestment, sortBy, sortDir])

  // Global day revenue filtered by date range
  const globalDayRevenue = useMemo(() => {
    if (!data?.clients) return []
    const map = new Map<string, number>()
    data.clients.forEach(c =>
      c.revenueByDay
        .filter(d => d.date >= dateFrom && d.date <= dateTo)
        .forEach(d => map.set(d.date, (map.get(d.date) ?? 0) + d.revenue))
    )
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v)
  }, [data, dateFrom, dateTo])

  const globalDayAdSpend = useMemo(() =>
    globalDayRevenue.map((v, i) => v * (0.10 + 0.03 * Math.sin(i * 0.8))), [globalDayRevenue])
  const globalDayPct = useMemo(() =>
    globalDayRevenue.map((v, i) => {
      const spend = globalDayAdSpend[i] ?? 0
      return v > 0 ? (spend / v) * 100 : 0
    }), [globalDayRevenue, globalDayAdSpend])
  const globalDayRoas = useMemo(() =>
    globalDayAdSpend.map((s, i) => {
      const rev = globalDayRevenue[i] ?? 0
      return s > 0 ? rev / s : 0
    }), [globalDayRevenue, globalDayAdSpend])

  // Global totals derived from already-computed per-client filtered values
  const filteredTotals = useMemo(() => {
    if (!clientsWithFiltered.length) return null
    const gmv     = clientsWithFiltered.reduce((s, c) => s + c.filteredGmv, 0)
    const adSpend = clientsWithFiltered.reduce((s, c) => s + c.filteredAdSpend, 0)
    const pctMidia = gmv > 0 ? (adSpend / gmv) * 100 : 0
    const avgRoas  = adSpend > 0 ? gmv / adSpend : 0
    return { gmv, adSpend, pctMidia, avgRoas }
  }, [clientsWithFiltered])

  const totalPct = filteredTotals?.pctMidia ?? 0

  const lowPerf = data?.clients.filter(c => c.trend < -5) ?? []

  // Active filter count
  const activeFilterCount = [
    minRevenue > 0,
    minInvestment > 0,
    sortBy !== 'gmv' || sortDir !== 'desc',
  ].filter(Boolean).length

  // Sort button helper
  function handleSort(field: SortBy, defaultDir: SortDir = 'desc') {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir(defaultDir)
    }
  }

  const sortLabel = (field: SortBy, label: string, defaultDir: SortDir = 'desc') => {
    const active = sortBy === field
    const Icon = active ? (sortDir === 'desc' ? TrendingDown : ChevronUp) : TrendingDown
    return (
      <button
        key={field}
        onClick={() => handleSort(field, defaultDir)}
        className={cn(
          'flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all',
          active
            ? 'bg-gradient-to-r from-primary to-blue-400 text-white border-primary/50'
            : 'border-white/[0.08] bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70'
        )}
      >
        {label}
        <Icon className="h-2.5 w-2.5" />
      </button>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#060b14]">

      {/* ── Alert banner ── */}
      {!alertDismissed && lowPerf.length > 0 && (
        <div className="bg-red-600 text-white text-[11px] px-4 py-2 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold whitespace-nowrap">
              Clientes com queda de performance:
            </span>
            <span className="truncate opacity-90">
              {lowPerf.map(c => c.name).join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-white/80">
            <span>há 1 dia</span>
            <button onClick={() => setAlertDismissed(true)} className="hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <Header
        title={role === 'CLIENT' ? 'Minha Loja' : 'Visão Geral'}
        subtitle={role === 'CLIENT' ? 'Seus dados de performance' : 'Todos os clientes da plataforma'}
      />

      <div className="flex-1 p-6 space-y-5">

        {/* ── Filter bar ── */}
        {role !== 'CLIENT' && (
        <div className="flex items-center gap-3 flex-wrap">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9 pr-8 py-2 text-sm rounded-xl border border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 w-52 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Date picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(v => !v)}
              className="flex items-center gap-2 border border-white/10 rounded-xl px-3 py-2 bg-white/[0.04] text-sm text-white/40 hover:bg-white/[0.07] hover:text-white/70 transition-all"
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="num text-xs">{fmtDMY(dateFrom)} - {fmtDMY(dateTo)}</span>
            </button>
            {showDatePicker && (
              <div className="absolute top-full mt-2 left-0 z-50 w-72 rounded-xl border border-white/[0.08] bg-[#0d1829] shadow-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-white/60">Período</p>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] text-white/40">
                    De
                    <input
                      type="date"
                      value={pendingFrom}
                      onChange={e => setPendingFrom(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-white/[0.08] bg-white/[0.04] text-white text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </label>
                  <label className="text-[11px] text-white/40">
                    Até
                    <input
                      type="date"
                      value={pendingTo}
                      onChange={e => setPendingTo(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-white/[0.08] bg-white/[0.04] text-white text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </label>
                </div>
                <button
                  onClick={() => {
                    setDateFrom(pendingFrom)
                    setDateTo(pendingTo)
                    setShowDatePicker(false)
                  }}
                  className="w-full text-xs font-semibold rounded-lg bg-gradient-to-r from-primary to-blue-400 text-white py-1.5 hover:opacity-90 transition-opacity"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFilters(v => !v)}
              className="relative flex items-center gap-2 border border-white/[0.08] rounded-xl px-3 py-2 bg-white/[0.04] text-sm text-white/40 hover:bg-white/[0.07] hover:text-white/70 transition-all"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gradient-to-r from-primary to-blue-400 text-[9px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="absolute top-full mt-2 left-0 z-50 w-80 rounded-xl border border-white/[0.08] bg-[#0d1829] shadow-2xl p-4 space-y-4">

                {/* Sort by */}
                <div>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Ordenar por</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sortLabel('gmv', 'Faturamento')}
                    {sortLabel('adSpend', 'Investimento')}
                    {sortLabel('trend', 'Tendência')}
                    {sortLabel('name', 'Nome A→Z', 'asc')}
                  </div>
                </div>

                {/* Min revenue */}
                <div>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Faturamento mín.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      ['Todos', 0],
                      ['> R$10k', 10000],
                      ['> R$50k', 50000],
                      ['> R$100k', 100000],
                      ['> R$500k', 500000],
                    ] as [string, number][]).map(([label, val]) => (
                      <button
                        key={label}
                        onClick={() => setMinRevenue(val)}
                        className={cn(
                          'text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all',
                          minRevenue === val
                            ? 'bg-gradient-to-r from-primary to-blue-400 text-white border-primary/50'
                            : 'border-white/[0.08] bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min investment */}
                <div>
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Investimento mín.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      ['Todos', 0],
                      ['> R$1k', 1000],
                      ['> R$5k', 5000],
                      ['> R$10k', 10000],
                      ['> R$50k', 50000],
                    ] as [string, number][]).map(([label, val]) => (
                      <button
                        key={label}
                        onClick={() => setMinInvestment(val)}
                        className={cn(
                          'text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all',
                          minInvestment === val
                            ? 'bg-gradient-to-r from-primary to-blue-400 text-white border-primary/50'
                            : 'border-white/[0.08] bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/70'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear */}
                <button
                  onClick={() => {
                    setMinRevenue(0)
                    setMinInvestment(0)
                    setSortBy('gmv')
                    setSortDir('desc')
                  }}
                  className="w-full text-[11px] font-semibold text-white/40 hover:text-white/70 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] transition-all"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* ── 4 KPI cards with sparklines ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {(
            [
              { label: 'Total Faturado',  rawValue: filteredTotals?.gmv ?? 0,       fmt: (v: number) => `R$ ${fmtBR(v)}`,   color: '#3b9eff', uid: 'fat',  sparkData: globalDayRevenue, accent: 'from-blue-500/20 to-transparent',    border: 'border-blue-500/20'    },
              { label: 'Total Investido', rawValue: filteredTotals?.adSpend ?? 0,  fmt: (v: number) => `R$ ${fmtBR(v)}`,   color: '#f59e0b', uid: 'inv',  sparkData: globalDayAdSpend, accent: 'from-amber-500/15 to-transparent',   border: 'border-amber-500/20'   },
              { label: '% de Mídia',      rawValue: totalPct,                      fmt: (v: number) => `${v.toFixed(2)}%`, color: '#10b981', uid: 'pct',  sparkData: globalDayPct,     accent: 'from-emerald-500/15 to-transparent', border: 'border-emerald-500/20' },
              { label: 'ROI Global',      rawValue: filteredTotals?.avgRoas ?? 0,  fmt: (v: number) => v.toFixed(2),       color: '#a78bfa', uid: 'roi',  sparkData: globalDayRoas,    accent: 'from-violet-500/15 to-transparent',  border: 'border-violet-500/20'  },
            ] as const
          ).map(item => (
            <div key={item.label}
              className={`group relative rounded-xl border ${item.border} bg-white/[0.03] overflow-hidden flex flex-col hover:bg-white/[0.05] transition-all duration-300 hover:shadow-lg`}
            >
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${item.accent} pointer-events-none`} />
              <div className="relative px-4 pt-4 pb-1">
                <p className="text-xs font-medium text-white/40">{item.label}</p>
                {loading
                  ? <div className="mt-2 h-8 w-36 rounded bg-white/10 animate-pulse" />
                  : <p className="num mt-1 text-2xl font-black text-white leading-tight">
                      {item.fmt(item.rawValue)}
                    </p>
                }
              </div>
              <div className="flex-1 h-14 relative">
                {!loading && item.sparkData.length > 1 && (
                  <Sparkline data={item.sparkData} color={item.color} uid={item.uid} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Client cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-5 w-32 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-6 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-6 w-44 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : sorted.map((client, idx) => {
                const cardMetrics = [
                  { label: 'Faturamento',     value: fmtCompact(client.filteredGmv),                    color: 'text-blue-400'    },
                  { label: 'Total investido', value: fmtCompact(client.filteredAdSpend),                 color: 'text-amber-400'   },
                  { label: 'ROI Global',      value: client.filteredRoas.toFixed(2),                     color: 'text-emerald-400' },
                  { label: '% de mídia',      value: `${client.filteredPct.toFixed(2)}%`,                color: 'text-violet-400'  },
                  { label: 'Avaliação',       value: `${client.avgRating.toFixed(1)} ★`,                 color: 'text-yellow-400'  },
                  { label: 'Conv./custo',     value: `${client.filteredConvCusto.toFixed(1)}/mil`,       color: 'text-cyan-400'    },
                ]

                return (
                  <div key={client.id}
                    className="group relative rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 flex flex-col gap-3 hover:bg-white/[0.05] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-default"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/8 to-transparent rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-end gap-2">
                      <span className="text-sm font-black text-white/25 shrink-0">{idx + 1}º</span>
                    </div>

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-[15px] text-white tracking-tight truncate">{client.name}</h3>
                          <TrendBadge value={client.trend} />
                        </div>
                        <a
                          href={`https://${client.slug}.com.br/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-white/25 hover:text-primary transition-colors mt-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          https://{client.slug}.com.br/
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                      <Link
                        href={`/dashboard?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`}
                        className="shrink-0 inline-flex items-center gap-1 text-[12px] font-bold border border-primary/50 text-primary rounded-lg px-3 py-1.5 hover:bg-primary/15 hover:border-primary/80 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 whitespace-nowrap"
                      >
                        Dashboard
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    <div className="relative flex items-center gap-1.5 flex-wrap">
                      {client.activeMarketplaces.map(mp => (
                        <MarketplaceBadge key={mp} marketplace={mp} size="xs" />
                      ))}
                    </div>

                    <div className="relative grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-white/[0.07]">
                      {cardMetrics.map(m => (
                        <div key={m.label} className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-white/30 leading-none">{m.label}</span>
                          <span className={cn('num text-sm font-black', m.color)}>{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* Empty state */}
        {!loading && sorted.length === 0 && (
          search ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nenhum cliente encontrado para &ldquo;{search}&rdquo;.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <UserPlus className="h-9 w-9 text-primary/60" />
                <div className="absolute inset-0 rounded-2xl bg-primary blur-xl opacity-10 scale-150" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-base font-semibold text-white/80">Nenhum cliente cadastrado ainda</p>
                <p className="text-sm text-white/35 max-w-xs">
                  Cadastre seu primeiro cliente e conecte as integrações para começar a visualizar os dados.
                </p>
              </div>
              <Link
                href="/admin/clientes"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 hover:opacity-90 transition-opacity"
              >
                <UserPlus className="h-4 w-4" />
                Cadastrar primeiro cliente
              </Link>
            </div>
          )
        )}

      </div>
    </div>
  )
}
