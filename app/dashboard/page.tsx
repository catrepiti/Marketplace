'use client'
import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, ShoppingCart, Wallet, Star, AlertTriangle, Package,
  BarChart2, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { RealtimeFeed } from '@/components/dashboard/RealtimeFeed'
import { TopProducts } from '@/components/dashboard/TopProducts'
import { MarketplaceComparison } from '@/components/dashboard/MarketplaceComparison'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { DashboardMetrics } from '@/lib/types'
import { formatCurrency, formatDate, statusConfig } from '@/lib/utils'
import { MARKETPLACE_LIST } from '@/lib/marketplaces'
import { cn } from '@/lib/utils'

const periodOptions = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
]

type ChartFilter = 'all' | string

function pct(current: number, prev: number): number {
  if (prev === 0) return 0
  return +((((current - prev) / prev) * 100).toFixed(1))
}

function TrendBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value <= 0 : value >= 0
  if (value === 0) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
      good ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    )}>
      {good ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

function DashboardContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const clientId      = searchParams.get('clientId')
  const clientName    = searchParams.get('clientName') ? decodeURIComponent(searchParams.get('clientName')!) : null

  // Guard: if no clientId, this page shouldn't be accessed directly — send back to Visão Geral
  useEffect(() => {
    if (!clientId) router.replace('/visao-geral')
  }, [clientId, router])

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [chartFilter, setChartFilter] = useState<ChartFilter>('all')

  const fetchMetrics = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const clientParam = clientId ? `&clientId=${clientId}` : ''
      const res = await fetch(`/api/dashboard?period=${period}${clientParam}`, { cache: 'no-store' })
      const data = await res.json()
      setMetrics(data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period, clientId])

  useEffect(() => {
    setLoading(true)
    fetchMetrics()
  }, [fetchMetrics])

  const headerTitle    = clientName ? clientName : 'Dashboard'
  const headerSubtitle = clientName ? 'Hub da integração — dados exclusivos desta loja' : 'Visão geral consolidada'

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-[#060b14]">
        {clientId && (
          <div className="px-6 pt-4 shrink-0">
            <Link href="/visao-geral" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Visão Geral
            </Link>
          </div>
        )}
        <Header title={headerTitle} subtitle={headerSubtitle} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-white/40">Carregando métricas{clientName ? ` de ${clientName}` : ''}...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const prev = metrics.prevPeriod
  const periodLabel = `vs ${period === '7' ? '7d' : period === '30' ? '30d' : period === '60' ? '60d' : '90d'} anteriores`

  const chartFilterButtons = [
    { key: 'all', label: 'Todos' },
    ...MARKETPLACE_LIST.map(mp => ({ key: mp.key, label: mp.label, color: mp.tailwind.text })),
  ]

  const kpis = [
    {
      icon: Wallet,
      title: 'Receita Total',
      value: formatCurrency(metrics.totalRevenue),
      subtitle: `${metrics.totalOrders} pedidos`,
      trend: pct(metrics.totalRevenue, prev.totalRevenue),
      accent: 'from-blue-500/15 to-transparent',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Ticket Médio',
      value: formatCurrency(metrics.averageTicket),
      trend: pct(metrics.averageTicket, prev.averageTicket),
      accent: 'from-emerald-500/15 to-transparent',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
    {
      icon: Star,
      title: 'Avaliação Média',
      value: `${metrics.averageRating} ★`,
      subtitle: 'Todos os marketplaces',
      trend: pct(metrics.averageRating, prev.averageRating),
      accent: 'from-amber-500/15 to-transparent',
      border: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
    },
    {
      icon: AlertTriangle,
      title: 'Taxa de Cancelamento',
      value: `${metrics.cancelRate}%`,
      trend: -pct(metrics.cancelRate, prev.cancelRate),
      invert: true,
      accent: metrics.cancelRate > 5 ? 'from-red-500/15 to-transparent' : 'from-violet-500/15 to-transparent',
      border: metrics.cancelRate > 5 ? 'border-red-500/20' : 'border-violet-500/20',
      iconColor: metrics.cancelRate > 5 ? 'text-red-400' : 'text-violet-400',
      iconBg: metrics.cancelRate > 5 ? 'bg-red-500/10' : 'bg-violet-500/10',
    },
  ]

  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      {/* Client hub back-navigation bar */}
      {clientId && (
        <div className="flex items-center gap-3 px-6 py-2.5 border-b border-white/[0.05] bg-primary/5 shrink-0">
          <Link
            href="/visao-geral"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Visão Geral
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-xs font-semibold text-white/60">{clientName}</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            Hub da loja
          </span>
        </div>
      )}

      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        onRefresh={() => fetchMetrics(true)}
        refreshing={refreshing}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Period selector */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-white/40">Período de análise</p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map(kpi => (
            <div
              key={kpi.title}
              className={`relative rounded-xl border ${kpi.border} bg-white/[0.03] overflow-hidden hover:bg-white/[0.05] transition-all duration-300`}
            >
              <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${kpi.accent} pointer-events-none`} />
              <div className="relative p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.iconBg)}>
                    <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
                  </div>
                  <TrendBadge value={kpi.trend} invert={kpi.invert} />
                </div>
                <p className="text-2xl font-black text-white leading-tight">{kpi.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{kpi.title}</p>
                {kpi.subtitle && <p className="text-[10px] text-white/25 mt-0.5">{kpi.subtitle}</p>}
                <p className="text-[10px] text-white/20 mt-1">{periodLabel}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Realtime */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Sales chart */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-white/40" />
                  <h3 className="text-sm font-semibold text-white">Evolução de Vendas</h3>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
                  {chartFilterButtons.map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setChartFilter(btn.key)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-all',
                        chartFilter === btn.key
                          ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                          : 'text-white/40 hover:text-white/70'
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4">
              <SalesChart data={metrics.salesByDay} period={parseInt(period)} filter={chartFilter} />
            </div>
          </div>

          {/* Realtime feed */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <h3 className="text-sm font-semibold text-white">Vendas em Tempo Real</h3>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <RealtimeFeed />
            </div>
          </div>
        </div>

        {/* Marketplace comparison + Top products */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
              <h3 className="text-sm font-semibold text-white">Comparativo por Marketplace</h3>
            </div>
            <div className="p-4">
              <MarketplaceComparison
                data={metrics.byMarketplace}
                totalRevenue={metrics.totalRevenue}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center gap-2">
              <Package className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white">Top Produtos</h3>
            </div>
            <div className="p-4">
              <TopProducts products={metrics.topProducts} />
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Pedidos Recentes</h3>
            <a href="/vendas" className="text-xs text-primary hover:text-blue-400 font-medium transition-colors">
              Ver todos →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wide">Pedido</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wide">Marketplace</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wide">Cliente</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wide hidden md:table-cell">Produto</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-white/30 uppercase tracking-wide">Valor</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wide hidden lg:table-cell">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {metrics.recentOrders.map(order => {
                  const sc = statusConfig[order.status]
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 text-xs font-mono text-white/40">{order.id}</td>
                      <td className="px-5 py-3"><MarketplaceBadge marketplace={order.marketplace} size="xs" /></td>
                      <td className="px-5 py-3 text-xs font-medium text-white">{order.customer}</td>
                      <td className="px-5 py-3 text-xs text-white/50 hidden md:table-cell max-w-[180px] truncate">{order.product}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-white text-right">{formatCurrency(order.totalPrice)}</td>
                      <td className="px-5 py-3">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.bg, sc.color)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-white/40 hidden lg:table-cell">{formatDate(order.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 bg-[#060b14] items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-white/40">Carregando...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
