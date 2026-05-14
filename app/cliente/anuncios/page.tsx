'use client'
import { useCallback, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, MousePointer, Target, Percent, ShoppingBag, BarChart2, Info } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdsMetrics } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'

const MP = {
  MERCADOLIVRE: { label: 'Mercado Livre', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  SHOPEE:       { label: 'Shopee',        color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Ativa',     cls: 'bg-green-100 text-green-700' },
  paused: { label: 'Pausada',   cls: 'bg-gray-100  text-gray-600'  },
  ended:  { label: 'Encerrada', cls: 'bg-red-100   text-red-600'   },
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
function acosColor(v: number) {
  if (v <= 15) return 'text-green-600'
  if (v <= 30) return 'text-yellow-600'
  return 'text-red-500'
}
function tacosColor(v: number) {
  if (v <= 5)  return 'text-green-600'
  if (v <= 12) return 'text-yellow-600'
  return 'text-red-500'
}
function pct(a: number, b: number) {
  if (b === 0) return 0
  return +((((a - b) / b) * 100).toFixed(1))
}

function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  if (value === 0) return null
  const good = invert ? value < 0 : value > 0
  return (
    <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', good ? 'text-green-600' : 'text-red-500')}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

function SpendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 shadow text-xs space-y-1">
      <p className="font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name === 'ml' ? 'Mercado Livre' : 'Shopee'}:</span>
          <span className="font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function InfoBox({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
      <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-blue-800">{title}</p>
        <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function ClienteAnunciosPage() {
  const [metrics, setMetrics]       = useState<AdsMetrics | null>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMetrics = useCallback(async (spinner = false) => {
    if (spinner) setRefreshing(true)
    try {
      const res = await fetch('/api/anuncios?period=30', { cache: 'no-store' })
      setMetrics(await res.json())
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  if (loading) return (
    <div className="flex flex-col flex-1">
      <Header title="Meus Anúncios" subtitle="Performance dos últimos 30 dias" />
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  )
  if (!metrics) return null

  const prev = metrics.prevPeriod

  return (
    <div className="flex flex-col flex-1 bg-background">
      <Header
        title="Meus Anúncios"
        subtitle="Performance dos últimos 30 dias"
        onRefresh={() => fetchMetrics(true)}
        refreshing={refreshing}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Explicação ACOS / TACOS ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoBox
            title="O que é ACOS?"
            description="Advertising Cost of Sale — quanto você gasta em anúncios para cada R$100 de receita gerada pelos próprios anúncios. Quanto menor, mais eficiente. Meta ideal: abaixo de 20%."
          />
          <InfoBox
            title="O que é TACOS?"
            description="Total Advertising Cost of Sale — seu investimento em anúncios dividido pela receita total da loja (orgânica + paga). Mostra o real peso do marketing no negócio. Meta ideal: abaixo de 8%."
          />
        </div>

        {/* ── KPI Cards principais ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* ACOS — destaque */}
          <Card className="border-2 border-primary/20 sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Percent className="h-4 w-4 text-primary" />
                </div>
                <Delta value={pct(metrics.acos, prev.acos)} invert />
              </div>
              <p className={cn('mt-3 text-3xl font-bold', acosColor(metrics.acos))}>{metrics.acos}%</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">ACOS</p>
              <p className="text-[10px] text-muted-foreground">Gasto / Receita de ads</p>
            </CardContent>
          </Card>

          {/* TACOS — destaque */}
          <Card className="border-2 border-primary/20 sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <Delta value={pct(metrics.tacos, prev.tacos)} invert />
              </div>
              <p className={cn('mt-3 text-3xl font-bold', tacosColor(metrics.tacos))}>{metrics.tacos}%</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">TACOS</p>
              <p className="text-[10px] text-muted-foreground">Gasto / Receita total</p>
            </CardContent>
          </Card>

          {/* ROAS */}
          <Card className="sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <Delta value={pct(metrics.roas, prev.roas)} />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{metrics.roas}x</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">ROAS</p>
              <p className="text-[10px] text-muted-foreground">Retorno sobre o gasto</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Métricas de volume ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: DollarSign,   label: 'Investimento',  value: formatCurrency(metrics.totalSpend),       delta: pct(metrics.totalSpend, prev.totalSpend),           iconBg: 'bg-violet-100', iconColor: 'text-violet-600', invert: false },
            { icon: MousePointer, label: 'Cliques',        value: fmt(metrics.totalClicks),                 delta: pct(metrics.totalClicks, prev.totalClicks),         iconBg: 'bg-cyan-100',   iconColor: 'text-cyan-600',   invert: false },
            { icon: Target,       label: 'Conversões',     value: fmt(metrics.totalConversions),            delta: pct(metrics.totalConversions, prev.totalConversions), iconBg: 'bg-orange-100', iconColor: 'text-orange-600', invert: false },
            { icon: BarChart2,    label: 'CTR médio',      value: `${metrics.ctr}%`,                        delta: undefined,                                           iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', invert: false },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', k.iconBg)}>
                    <k.icon className={cn('h-4 w-4', k.iconColor)} />
                  </div>
                  {k.delta !== undefined && <Delta value={k.delta} invert={k.invert} />}
                </div>
                <p className="mt-2 text-xl font-bold text-foreground">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Spend chart ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart2 className="h-4 w-4" /> Investimento diário em anúncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics.spendByDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cmlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EAB308" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cshopeeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EE4D2D" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#EE4D2D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label"
                  ticks={metrics.spendByDay.filter((_, i) => i % 5 === 0).map(d => d.label)}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `R$${v}`}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<SpendTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={v => v === 'ml' ? 'Mercado Livre' : 'Shopee'} />
                <Area type="monotone" dataKey="ml"     name="ml"     stroke="#EAB308" strokeWidth={2} fill="url(#cmlGrad)"     dot={false} />
                <Area type="monotone" dataKey="shopee" name="shopee" stroke="#EE4D2D" strokeWidth={2} fill="url(#cshopeeGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Breakdown por plataforma ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {metrics.byMarketplace.map(mp => {
            const cfg = MP[mp.marketplace as keyof typeof MP]
            if (!cfg) return null
            return (
              <Card key={mp.marketplace} className={cn('border', cfg.border)}>
                <div className={cn('flex items-center gap-2 px-4 py-3 rounded-t-xl', cfg.bg)}>
                  <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                  <p className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</p>
                </div>
                <CardContent className="p-4 space-y-2.5">
                  {[
                    { label: 'Investimento',   value: formatCurrency(mp.spend) },
                    { label: 'Receita de ads', value: formatCurrency(mp.revenue) },
                    { label: 'Receita total',  value: formatCurrency(mp.totalRevenue) },
                    { label: 'ROAS',           value: `${mp.roas}x` },
                    { label: 'Cliques',        value: fmt(mp.clicks) },
                    { label: 'Conversões',     value: String(mp.conversions) },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold">{row.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2.5 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                      <p className={cn('text-lg font-bold', acosColor(mp.acos))}>{mp.acos}%</p>
                      <p className="text-[10px] text-muted-foreground font-medium">ACOS</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                      <p className={cn('text-lg font-bold', tacosColor(mp.tacos))}>{mp.tacos}%</p>
                      <p className="text-[10px] text-muted-foreground font-medium">TACOS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ── Suas campanhas ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Suas campanhas ativas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {metrics.campaigns.filter(c => c.status !== 'ended').map(c => {
                const mpCfg = MP[c.marketplace as keyof typeof MP]
                const roas  = c.spend > 0   ? (c.revenue / c.spend).toFixed(2)            : '0'
                const acos  = c.revenue > 0 ? ((c.spend / c.revenue) * 100).toFixed(1)    : '—'
                const st    = STATUS_MAP[c.status]
                return (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-[11px] font-semibold flex items-center gap-1', mpCfg.color)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', mpCfg.dot)} />
                            {mpCfg.label}
                          </span>
                          <span className="text-muted-foreground text-[11px]">·</span>
                          <span className="text-[11px] text-muted-foreground">{c.type}</span>
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', st.cls)}>{st.label}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        <p className="text-xs font-semibold">{formatCurrency(c.spend)}</p>
                        <p className="text-[10px] text-muted-foreground">investido</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'ROAS',   value: `${roas}x`,  color: Number(roas) >= 3 ? 'text-green-600' : Number(roas) >= 1.5 ? 'text-yellow-600' : 'text-red-500' },
                        { label: 'ACOS',   value: acos !== '—' ? `${acos}%` : '—', color: acos !== '—' ? acosColor(Number(acos)) : 'text-muted-foreground' },
                        { label: 'Cliques',value: fmt(c.clicks),   color: 'text-foreground' },
                        { label: 'Conv.',  value: String(c.conversions), color: 'text-foreground' },
                      ].map(m => (
                        <div key={m.label} className="rounded-lg bg-muted/30 p-1.5">
                          <p className={cn('text-sm font-bold', m.color)}>{m.value}</p>
                          <p className="text-[9px] text-muted-foreground">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
