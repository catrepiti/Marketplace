'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package,
  Star, AlertTriangle, ShieldAlert, Clock, XCircle, Megaphone,
  BarChart3, Activity, Loader2, Calendar,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

interface SalesData {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  avgTicket: number
  activeListings: number
  reputationScore: number
  salesByDay: { date: string; revenue: number; orders: number }[]
  salesByMarketplace: Record<string, number>
  topProducts: { name: string; revenue: number; quantity: number }[]
  recentSales: any[]
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtNum = (v: number) =>
  v.toLocaleString('pt-BR')

function getDefaultPeriod() {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const W = 200
  const H = 40
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - 4 - ((v - min) / range) * (H - 8)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const linePath = 'M ' + pts.join(' L ')
  const areaPath = `M 0,${H} L ${pts.join(' L ')} L ${W},${H} Z`
  const gid = `sp-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ActivityScore({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const bg = score >= 80 ? 'from-emerald-500/20' : score >= 50 ? 'from-amber-500/20' : 'from-red-500/20'
  const label = score >= 80 ? 'Excelente' : score >= 50 ? 'Bom' : 'Atenção necessária'
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 relative overflow-hidden">
      <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-50', bg)} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-white/30" />
          <span className="text-xs font-semibold text-white/40">Score de Atividade</span>
        </div>
        <div className="flex items-end gap-3">
          <span className={cn('text-4xl font-black', color)}>{score}</span>
          <span className={cn('text-sm font-medium mb-1', color)}>{label}</span>
        </div>
        <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-1000',
            score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
          )} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  )
}

function ReputationCard({ data }: { data: SalesData }) {
  const metrics = [
    { label: 'Mediações', value: 0, icon: ShieldAlert, status: 'ok' },
    { label: 'Cancelamentos', value: 0, icon: XCircle, status: 'ok' },
    { label: 'Atrasos no envio', value: 0, icon: Clock, status: 'ok' },
    { label: 'Reclamações', value: 0, icon: AlertTriangle, status: 'ok' },
  ]
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="h-4 w-4 text-white/30" />
        <span className="text-xs font-semibold text-white/40">Monitoramento de Reputação</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className="h-3.5 w-3.5 text-white/20" />
              <span className="text-[10px] text-white/25">{m.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{m.value}</span>
              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">OK</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VisaoGeralPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(getDefaultPeriod)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard?from=${period.from}&to=${period.to}`)
        if (res.ok) {
          setSalesData(await res.json())
        } else {
          setSalesData({
            totalRevenue: 0, totalOrders: 0, totalItems: 0, avgTicket: 0,
            activeListings: 0, reputationScore: 75,
            salesByDay: [], salesByMarketplace: {}, topProducts: [], recentSales: [],
          })
        }
      } catch {
        setSalesData({
          totalRevenue: 0, totalOrders: 0, totalItems: 0, avgTicket: 0,
          activeListings: 0, reputationScore: 75,
          salesByDay: [], salesByMarketplace: {}, topProducts: [], recentSales: [],
        })
      }
      setLoading(false)
    }
    load()
  }, [period])

  const dayRevenues = useMemo(() =>
    salesData?.salesByDay?.map(d => d.revenue) ?? [], [salesData])
  const dayOrders = useMemo(() =>
    salesData?.salesByDay?.map(d => d.orders) ?? [], [salesData])

  const activityScore = useMemo(() => {
    if (!salesData) return 0
    let score = 50
    if (salesData.totalOrders > 0) score += 15
    if (salesData.totalOrders > 10) score += 10
    if (salesData.totalRevenue > 1000) score += 10
    if (salesData.topProducts.length > 3) score += 5
    if (Object.keys(salesData.salesByMarketplace).length > 1) score += 10
    return Math.min(score, 100)
  }, [salesData])

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width,240px)] sidebar-transition">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-white/30 mt-1">Resumo financeiro da sua operação</p>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-white/30" />
              <input type="date" value={period.from}
                onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))}
                className="bg-transparent text-sm text-white border-none outline-none" />
              <span className="text-white/20">—</span>
              <input type="date" value={period.to}
                onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))}
                className="bg-transparent text-sm text-white border-none outline-none" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : salesData && (
            <div className="space-y-6">

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Faturamento', value: fmt(salesData.totalRevenue), icon: DollarSign, color: '#3b9eff', spark: dayRevenues },
                  { label: 'Pedidos', value: fmtNum(salesData.totalOrders), icon: ShoppingBag, color: '#10b981', spark: dayOrders },
                  { label: 'Itens vendidos', value: fmtNum(salesData.totalItems), icon: Package, color: '#a78bfa', spark: [] },
                  { label: 'Ticket médio', value: fmt(salesData.avgTicket), icon: BarChart3, color: '#f59e0b', spark: [] },
                  { label: 'Anúncios ativos', value: fmtNum(salesData.activeListings), icon: Megaphone, color: '#ec4899', spark: [] },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 overflow-hidden relative group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                      <span className="text-xs text-white/30">{kpi.label}</span>
                    </div>
                    <p className="text-xl font-bold text-white font-mono">{kpi.value}</p>
                    {kpi.spark.length > 1 && (
                      <div className="h-8 mt-2 -mx-1">
                        <Sparkline data={kpi.spark} color={kpi.color} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Activity Score + Reputation */}
              <div className="grid lg:grid-cols-2 gap-6">
                <ActivityScore score={activityScore} />
                <ReputationCard data={salesData} />
              </div>

              {/* Revenue by Marketplace + Top Products */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* Revenue by marketplace */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-4 w-4 text-white/30" />
                    <span className="text-xs font-semibold text-white/40">Receita por Marketplace</span>
                  </div>
                  {Object.keys(salesData.salesByMarketplace).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(salesData.salesByMarketplace)
                        .sort((a, b) => b[1] - a[1])
                        .map(([mp, val]) => {
                          const pct = salesData.totalRevenue > 0 ? (val / salesData.totalRevenue) * 100 : 0
                          return (
                            <div key={mp}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-white/50 capitalize font-medium">{mp}</span>
                                <span className="text-white/60 font-mono">{fmt(val)}</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/15 py-8 text-center">Conecte um marketplace para ver dados</p>
                  )}
                </div>

                {/* Top products */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-white/30" />
                    <span className="text-xs font-semibold text-white/40">Top Produtos</span>
                  </div>
                  {salesData.topProducts.length > 0 ? (
                    <div className="space-y-2.5">
                      {salesData.topProducts.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-bold text-white/15 w-5">{i + 1}</span>
                            <span className="text-sm text-white/60 truncate">{p.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <span className="text-sm font-bold text-white font-mono">{fmt(p.revenue)}</span>
                            <span className="text-xs text-white/20 ml-1">({p.quantity} un.)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/15 py-8 text-center">Nenhuma venda registrada</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
