'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  Package, AlertTriangle, XCircle, CheckCircle2, Search,
  TrendingDown, TrendingUp, Edit2, Check, X, ChevronDown,
  Flame, DollarSign, Clock, BarChart3,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { StockItem, StockStatus, IssueType, InventoryStats, INVENTORY_CATEGORIES } from '@/lib/mock/inventory-generator'
import { MARKETPLACE_LIST } from '@/lib/marketplaces'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  warning:  { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  info:     { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
}

const ISSUE_CONFIG: Record<IssueType, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  stockout:      { label: 'Ruptura',        color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: XCircle       },
  stockout_risk: { label: 'Risco Ruptura',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  icon: AlertTriangle  },
  dead_stock:    { label: 'Estoque Parado', color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  icon: Clock          },
  slow_moving:   { label: 'Giro Lento',     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: TrendingDown   },
  healthy:       { label: 'Saudável',       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2   },
}

function HealthDot({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : score >= 30 ? 'bg-orange-500' : 'bg-red-500'
  const textColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-2 w-2 rounded-full', color)} />
      <span className={cn('num text-xs font-semibold', textColor)}>{score}</span>
    </div>
  )
}

function StockLevelBar({ quantity, minQuantity }: { quantity: number; minQuantity: number }) {
  const max   = Math.max(quantity, minQuantity * 3, 5)
  const pct   = Math.min((quantity / max) * 100, 100)
  const color = quantity === 0 ? 'bg-red-500' : quantity <= minQuantity ? 'bg-orange-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2 w-28">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="num text-xs font-semibold text-white w-5 text-right shrink-0">{quantity}</span>
    </div>
  )
}

function QuantityEditor({ item, onSave }: { item: StockItem; onSave: (id: string, qty: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(String(item.quantity))
  const [saving,  setSaving]  = useState(false)

  const save = async () => {
    const qty = parseInt(value)
    if (isNaN(qty) || qty < 0) return
    setSaving(true)
    await onSave(item.id, qty)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setEditing(true); setValue(String(item.quantity)) }}
        className="group flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
      >
        <span className="num">{item.quantity} un</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/40" />
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <Input type="number" value={value} onChange={e => setValue(e.target.value)}
        className="h-6 w-16 text-xs px-2 bg-white/[0.05] border-white/[0.08] text-white" autoFocus
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
      />
      <button onClick={save} disabled={saving} className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50"><Check className="h-3.5 w-3.5" /></button>
      <button onClick={() => setEditing(false)} className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}

// ── Diagnosis Drawer ──────────────────────────────────────────────────────────
function DiagnosisRow({ item, onSave }: { item: StockItem; onSave: (id: string, qty: number) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const issue = ISSUE_CONFIG[item.issueType]
  const IssueIcon = issue.icon
  const hasProblems = item.lossReasons.length > 0

  return (
    <>
      <tr
        className={cn(
          'border-b border-white/[0.05] cursor-pointer transition-colors hover:bg-white/[0.03]',
        )}
        onClick={() => hasProblems && setOpen(v => !v)}
      >
        {/* Product */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none shrink-0">{item.imageEmoji}</span>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[180px]">{item.name}</p>
              <p className="text-[10px] text-white/40">{item.sku} · {item.category}</p>
            </div>
          </div>
        </td>
        {/* Channel */}
        <td className="px-3 py-3 shrink-0">
          <MarketplaceBadge marketplace={item.marketplace} size="xs" />
        </td>
        {/* Issue type */}
        <td className="px-3 py-3">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
            issue.bg, issue.color, issue.border
          )}>
            <IssueIcon className="h-3 w-3" />
            {issue.label}
            {hasProblems && <span className="ml-0.5 rounded-full bg-white/10 px-1 text-[10px]">{item.lossReasons.length}</span>}
          </span>
        </td>
        {/* Health */}
        <td className="px-3 py-3"><HealthDot score={item.healthScore} /></td>
        {/* Stock level */}
        <td className="px-3 py-3"><StockLevelBar quantity={item.quantity} minQuantity={item.minQuantity} /></td>
        {/* Editable quantity */}
        <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
          <QuantityEditor item={item} onSave={onSave} />
        </td>
        {/* Min */}
        <td className="num px-3 py-3 text-right text-xs text-white/40">{item.minQuantity}</td>
        {/* Price */}
        <td className="num px-3 py-3 text-right text-xs font-medium text-white/70">{fmt(item.unitPrice)}</td>
        {/* Revenue lost */}
        <td className="px-3 py-3 text-right">
          {item.lostRevenueLast30d > 0 ? (
            <span className="num text-xs font-bold text-red-400">-{fmt(item.lostRevenueLast30d)}</span>
          ) : item.revenueAtRisk > 0 ? (
            <span className="num text-xs font-semibold text-orange-400">risco {fmt(item.revenueAtRisk)}</span>
          ) : (
            <span className="text-[11px] text-emerald-400 font-medium">—</span>
          )}
        </td>
        {/* Forecast */}
        <td className="px-3 py-3 text-right">
          {item.status === 'out_of_stock' ? (
            <span className="text-[11px] font-bold text-red-400 animate-pulse">Reabastecer já</span>
          ) : item.daysUntilStockout !== null ? (
            <span className={cn('num text-[11px] font-semibold',
              item.daysUntilStockout <= 5  ? 'text-red-400' :
              item.daysUntilStockout <= 14 ? 'text-orange-400' :
              'text-white/40')}>
              {item.daysUntilStockout}d
            </span>
          ) : <span className="text-[11px] text-white/40">—</span>}
        </td>
        {/* Expand toggle */}
        <td className="px-3 py-3">
          {hasProblems && (
            <ChevronDown className={cn('h-4 w-4 text-white/30 transition-transform', open && 'rotate-180')} />
          )}
        </td>
      </tr>

      {/* ── Diagnosis panel ── */}
      {open && hasProblems && (
        <tr className="border-b border-white/[0.05]">
          <td colSpan={11} className="bg-white/[0.02] px-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white uppercase tracking-wide">
                  Diagnóstico de Problemas — {item.name}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-white/40">Reposição sugerida:
                    <span className="num font-bold text-white ml-1">{item.suggestedRestockQty} un</span>
                  </span>
                  <span className="text-white/40">Margem:
                    <span className="num font-bold text-white ml-1">{(((item.unitPrice - item.unitCost) / item.unitPrice) * 100).toFixed(0)}%</span>
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                {item.lossReasons.map((reason, i) => {
                  const sev = SEVERITY_CONFIG[reason.severity]
                  return (
                    <div key={i} className={cn('flex items-start gap-3 rounded-xl border p-3', sev.bg, sev.border)}>
                      <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border', sev.bg, sev.border)}>
                        <span className={cn('text-xs font-bold', sev.color)}>
                          {reason.severity === 'critical' ? '!' : reason.severity === 'warning' ? '⚠' : 'i'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn('text-xs font-bold', sev.color)}>{reason.label}</span>
                          {reason.revenueLost > 0 && (
                            <span className={cn('num text-[11px] font-semibold rounded-full px-2 py-0.5 border', sev.bg, sev.color, sev.border)}>
                              perda de {fmt(reason.revenueLost)}
                            </span>
                          )}
                        </div>
                        <p className={cn('text-xs leading-relaxed', sev.color, 'opacity-80')}>{reason.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action plan */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-white/40 font-semibold uppercase tracking-wide">Ação recomendada:</span>
                {item.status === 'out_of_stock' && (
                  <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                    Comprar {item.suggestedRestockQty} unidades imediatamente — cada dia parado custa {fmt(item.avgMonthlySales / 30 * item.unitPrice)} em receita
                  </span>
                )}
                {item.status === 'low_stock' && (
                  <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                    Acionar fornecedor agora — estoque para ~{item.daysUntilStockout} dias no ritmo atual de {item.avgMonthlySales} vendas/mês
                  </span>
                )}
                {item.issueType === 'dead_stock' && (
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
                    Ative promoção ou relance o anúncio — verifique se foi pausado ou perdeu posicionamento
                  </span>
                )}
                {item.issueType === 'slow_moving' && (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                    Crie promoção relâmpago de 15–20% para reduzir estoque e liberar capital
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EstoquePage() {
  const [items,    setItems]    = useState<StockItem[]>([])
  const [stats,    setStats]    = useState<InventoryStats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [marketplace, setMarketplace] = useState('')
  const [category,    setCategory]    = useState('')
  const [status,      setStatus]      = useState('')
  const [search,      setSearch]      = useState('')
  const [debSearch,   setDebSearch]   = useState('')
  const [issueFilter, setIssueFilter] = useState<IssueType | ''>('')

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchData = useCallback(async (spin = false) => {
    if (spin) setRefreshing(true)
    try {
      const params = new URLSearchParams({
        ...(marketplace && { marketplace }),
        ...(category    && { category }),
        ...(status      && { status }),
        ...(debSearch   && { search: debSearch }),
      })
      const res  = await fetch(`/api/estoque?${params}`, { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items)
      setStats(data.stats)
    } finally { setLoading(false); setRefreshing(false) }
  }, [marketplace, category, status, debSearch])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateStock = async (id: string, quantity: number) => {
    const res = await fetch('/api/estoque', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity }),
    })
    const updated = await res.json()
    setItems(prev => prev.map(i => i.id === id ? updated : i))
  }

  const filtered = issueFilter ? items.filter(i => i.issueType === issueFilter) : items
  const problemItems = items.filter(i => i.issueType !== 'healthy')
  const criticalLoss = items.filter(i => i.status === 'out_of_stock' && i.avgMonthlySales > 30)

  const kpis = [
    { label: 'Total SKUs',       value: stats?.totalSkus ?? 0,          icon: Package,       gradientFrom: 'from-blue-500/15',   iconColor: 'text-blue-400',    fmtFn: String },
    { label: 'Em Estoque',       value: stats?.inStock ?? 0,            icon: CheckCircle2,  gradientFrom: 'from-emerald-500/15',iconColor: 'text-emerald-400', fmtFn: String },
    { label: 'Estoque Baixo',    value: stats?.lowStock ?? 0,           icon: AlertTriangle, gradientFrom: 'from-amber-500/15',  iconColor: 'text-amber-400',   fmtFn: String },
    { label: 'Sem Estoque',      value: stats?.outOfStock ?? 0,         icon: XCircle,       gradientFrom: 'from-red-500/15',    iconColor: 'text-red-400',     fmtFn: String },
    { label: 'Perda de Receita', value: stats?.totalLostRevenue ?? 0,   icon: TrendingDown,  gradientFrom: 'from-rose-500/15',   iconColor: 'text-rose-400',    fmtFn: fmt },
    { label: 'Receita em Risco', value: stats?.totalRevenueAtRisk ?? 0, icon: Flame,         gradientFrom: 'from-orange-500/15', iconColor: 'text-orange-400',  fmtFn: fmt },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Gestão de Estoque"
        subtitle="Diagnóstico de perdas e controle centralizado de inventário"
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
      />

      <div className="flex-1 p-6 space-y-5">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
                {/* gradient glow top */}
                <div className={cn('absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent', kpi.gradientFrom)} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-white/40 font-medium">{kpi.label}</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                      <Icon className={cn('h-4 w-4', kpi.iconColor)} />
                    </div>
                  </div>
                  {loading
                    ? <div className="h-8 w-20 rounded-lg bg-white/[0.06] animate-pulse" />
                    : <p className="num text-2xl font-black text-white leading-none">
                        {kpi.fmtFn(kpi.value as any)}
                      </p>
                  }
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Critical loss banner ── */}
        {!loading && criticalLoss.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  Alerta crítico: {criticalLoss.length} produto{criticalLoss.length > 1 ? 's' : ''} em ruptura com alta demanda
                </p>
                <p className="text-xs text-red-400 mt-0.5 mb-2">
                  Perda total estimada: <span className="num font-bold">{fmt(criticalLoss.reduce((s, i) => s + i.lostRevenueLast30d, 0))}</span> nos últimos 30 dias
                </p>
                <div className="flex flex-wrap gap-2">
                  {criticalLoss.map(i => (
                    <div key={i.id} className="text-xs bg-white/[0.05] border border-red-500/20 text-red-400 rounded-lg px-3 py-1.5">
                      <span className="font-semibold text-white">{i.imageEmoji} {i.name.split(' ').slice(0, 3).join(' ')}</span>
                      <span className="text-red-400 ml-1">— {i.avgMonthlySales}/mês · perda {fmt(i.lostRevenueLast30d)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Issue quick filters ── */}
        {!loading && (
          <div className="flex flex-wrap gap-2">
            {([
              { key: '', label: 'Todos', count: items.length },
              { key: 'stockout',      label: 'Ruptura'         , count: items.filter(i => i.issueType === 'stockout').length      },
              { key: 'stockout_risk', label: 'Risco de Ruptura', count: items.filter(i => i.issueType === 'stockout_risk').length  },
              { key: 'dead_stock',    label: 'Estoque Parado',   count: items.filter(i => i.issueType === 'dead_stock').length     },
              { key: 'slow_moving',   label: 'Giro Lento',       count: items.filter(i => i.issueType === 'slow_moving').length    },
              { key: 'healthy',       label: 'Saudável',         count: items.filter(i => i.issueType === 'healthy').length        },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setIssueFilter(f.key as IssueType | '')}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                  issueFilter === f.key
                    ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-sm'
                    : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-white/[0.08]'
                )}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    issueFilter === f.key ? 'bg-white/20' : 'bg-white/10'
                  )}>{f.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <Input
                placeholder="Buscar produto ou SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl"
              />
            </div>
            <Select
              value={marketplace}
              onChange={e => setMarketplace(e.target.value)}
              options={MARKETPLACE_LIST.map(mp => ({ value: mp.key, label: mp.label }))}
              placeholder="Todos os canais"
              className="w-44 h-8 text-xs bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
            />
            <Select
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={INVENTORY_CATEGORIES.map(c => ({ value: c, label: c }))}
              placeholder="Todas as categorias"
              className="w-48 h-8 text-xs bg-white/[0.05] border-white/[0.08] text-white rounded-xl"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">
                  Inventário · {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
                </h2>
                {problemItems.length > 0 && (
                  <span className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-full px-2 py-0.5 text-xs font-semibold">
                    {problemItems.length} com diagnóstico
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/30">Clique na linha para ver diagnóstico · Clique na qtd para editar</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-white/10 mb-3" />
              <p className="text-sm text-white/40">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Produto</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Canal</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Diagnóstico</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Saúde</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wide">Nível</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Qtd.</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Mín.</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Preço</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Perda/Risco</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wide">Previsão</th>
                    <th className="px-2 py-2.5 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .sort((a, b) => a.healthScore - b.healthScore)
                    .map(item => (
                      <DiagnosisRow key={item.id} item={item} onSave={handleUpdateStock} />
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
