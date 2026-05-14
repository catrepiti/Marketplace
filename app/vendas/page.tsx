'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  ShoppingCart, Search, Download, ChevronLeft, ChevronRight,
  TrendingUp, XCircle, RotateCcw, TrendingDown, DollarSign,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Header } from '@/components/layout/Header'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { Button } from '@/components/ui/button'
import { Order, OrderStatus } from '@/lib/types'
import { formatCurrency, formatDate, statusConfig } from '@/lib/utils'
import { MARKETPLACE_LIST } from '@/lib/marketplaces'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

const periodOptions = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
]

const statusOptions: { value: string; label: string }[] = [
  { value: 'paid', label: 'Pago' },
  { value: 'processing', label: 'Em processamento' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'returned', label: 'Devolvido' },
]

interface Summary {
  totalOrders: number
  totalRevenue: number
  cancelled: number
  returned: number
}

function pct(current: number, prev: number) {
  if (prev === 0) return null
  return +(((current - prev) / prev) * 100).toFixed(1)
}

function DeltaBadge({ current, prev, invert = false }: { current: number; prev: number; invert?: boolean }) {
  const delta = pct(current, prev)
  if (delta === null) return null
  const good = invert ? delta <= 0 : delta >= 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
      good ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    )}>
      {good ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {delta !== null && delta > 0 ? '+' : ''}{delta}%
    </span>
  )
}

const MiniTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#0d1829] p-2.5 shadow-xl text-xs">
      <p className="font-medium text-white/60 mb-1">{label}</p>
      <p className="text-blue-400 font-semibold">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

function exportCSV(orders: Order[]) {
  const headers = ['ID', 'ID Externo', 'Marketplace', 'Cliente', 'Produto', 'SKU', 'Qtd', 'Preço Unit.', 'Total', 'Status', 'Data']
  const rows = orders.map(o => [
    o.id, o.externalId, o.marketplace, o.customer, o.product,
    o.sku, o.quantity, o.unitPrice.toFixed(2), o.totalPrice.toFixed(2),
    statusConfig[o.status].label, formatDate(o.createdAt),
  ])
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'vendas.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function VendasPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null)
  const [salesByDay, setSalesByDay] = useState<{ date: string; revenue: number; orders: number }[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [period, setPeriod] = useState('30')
  const [marketplace, setMarketplace] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchOrders = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE), period,
        ...(marketplace && { marketplace }),
        ...(status && { status }),
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      const res = await fetch(`/api/vendas?${params}`, { cache: 'no-store' })
      const json = await res.json()
      setOrders(json.data)
      setTotal(json.total)
      setSummary(json.summary)
      setPrevSummary(json.prevSummary)
      setSalesByDay(json.salesByDay ?? [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, period, marketplace, status, debouncedSearch])

  useEffect(() => {
    setLoading(true)
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => { setPage(1) }, [period, marketplace, status, debouncedSearch])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const chartTicks = salesByDay.length <= 7
    ? salesByDay.map(d => d.date)
    : salesByDay.filter((_, i) => i % Math.ceil(salesByDay.length / 7) === 0).map(d => d.date)

  const kpiCards = summary && prevSummary ? [
    {
      icon: ShoppingCart,
      label: 'Pedidos',
      value: summary.totalOrders,
      display: String(summary.totalOrders),
      prev: prevSummary.totalOrders,
      accent: 'from-blue-500/15 to-transparent',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
    {
      icon: DollarSign,
      label: 'Receita',
      value: summary.totalRevenue,
      display: formatCurrency(summary.totalRevenue),
      prev: prevSummary.totalRevenue,
      accent: 'from-emerald-500/15 to-transparent',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      icon: XCircle,
      label: 'Cancelados',
      value: summary.cancelled,
      display: String(summary.cancelled),
      prev: prevSummary.cancelled,
      invert: true,
      accent: 'from-red-500/15 to-transparent',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
    },
    {
      icon: RotateCcw,
      label: 'Devolvidos',
      value: summary.returned,
      display: String(summary.returned),
      prev: prevSummary.returned,
      invert: true,
      accent: 'from-orange-500/15 to-transparent',
      border: 'border-orange-500/20',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
    },
  ] : []

  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header
        title="Vendas"
        subtitle="Histórico detalhado de pedidos"
        onRefresh={() => fetchOrders(true)}
        refreshing={refreshing}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* KPI Cards */}
        {kpiCards.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpiCards.map(kpi => (
              <div
                key={kpi.label}
                className={`relative rounded-xl border ${kpi.border} bg-white/[0.03] overflow-hidden hover:bg-white/[0.05] transition-all duration-300`}
              >
                <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${kpi.accent} pointer-events-none`} />
                <div className="relative p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.iconBg)}>
                      <kpi.icon className={cn('h-4 w-4', kpi.iconColor)} />
                    </div>
                    <DeltaBadge current={kpi.value} prev={kpi.prev} invert={kpi.invert} />
                  </div>
                  <p className="text-2xl font-black text-white leading-tight">{kpi.display}</p>
                  <p className="text-xs text-white/40 mt-0.5">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trend chart */}
        {salesByDay.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Tendência de Receita</h3>
              <span className="text-xs text-white/30">
                {periodOptions.find(p => p.value === period)?.label}
              </span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={salesByDay} margin={{ top: 0, right: 4, left: 0, bottom: 0 }} barSize={period === '7' ? 20 : period === '30' ? 8 : 4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    ticks={chartTicks}
                    tickFormatter={d => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(d + 'T00:00:00'))}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                    axisLine={false} tickLine={false} width={48}
                  />
                  <Tooltip content={<MiniTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cliente, produto, pedido..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-all"
              />
            </div>
            {/* Period pills */}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
              {periodOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    period === opt.value
                      ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Marketplace select */}
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
            {/* Status select */}
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            >
              <option value="">Todos status</option>
              {statusOptions.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {/* Export */}
            <button
              onClick={() => exportCSV(orders)}
              disabled={orders.length === 0}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-xs text-white/60 hover:text-white hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingCart className="h-12 w-12 text-white/10 mb-3" />
              <p className="text-sm font-medium text-white/40">Nenhum pedido encontrado</p>
              <p className="text-xs text-white/25 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['Pedido', 'Marketplace', 'Cliente', 'Produto', 'Qtd', 'Valor', 'Status', 'Data'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {orders.map(order => {
                    const sc = statusConfig[order.status]
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono font-medium text-white">{order.id}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{order.externalId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <MarketplaceBadge marketplace={order.marketplace} size="xs" />
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-white whitespace-nowrap">{order.customer}</td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-xs text-white/80 truncate">{order.product}</p>
                          <p className="text-[10px] text-white/30 font-mono">{order.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-center font-medium text-white/50">{order.quantity}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-white whitespace-nowrap">{formatCurrency(order.totalPrice)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', sc.bg, sc.color)}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-white/30">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} pedidos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-all"
              >
                «
              </button>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-white/60 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-all"
              >
                »
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
