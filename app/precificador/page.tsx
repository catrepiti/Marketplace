'use client'

import { useState, useMemo } from 'react'
import {
  Calculator, TrendingUp, TrendingDown, DollarSign, Percent,
  ShoppingBag, RotateCcw, Plus, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { Input } from '@/components/ui/input'

const MARKETPLACE_FEES: Record<string, { label: string; commission: number; feeFixed: number }> = {
  mercadolivre: { label: 'Mercado Livre', commission: 16, feeFixed: 6 },
  shopee:       { label: 'Shopee',        commission: 14, feeFixed: 3 },
  amazon:       { label: 'Amazon',        commission: 15, feeFixed: 0 },
  custom:       { label: 'Personalizado', commission: 0,  feeFixed: 0 },
}

interface Product {
  id: string
  name: string
  costPrice: number
  salePrice: number
  taxRate: number
  marketplace: string
  shippingCost: number
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtPct = (v: number) => `${v.toFixed(1)}%`

function emptyProduct(): Product {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    costPrice: 0,
    salePrice: 0,
    taxRate: 6,
    marketplace: 'mercadolivre',
    shippingCost: 0,
  }
}

function calcProduct(p: Product) {
  const mp = MARKETPLACE_FEES[p.marketplace] ?? MARKETPLACE_FEES.mercadolivre
  const commissionAmount = (p.salePrice * mp.commission) / 100
  const taxAmount = (p.salePrice * p.taxRate) / 100
  const totalCost = p.costPrice + commissionAmount + taxAmount + mp.feeFixed + p.shippingCost
  const profit = p.salePrice - totalCost
  const margin = p.salePrice > 0 ? (profit / p.salePrice) * 100 : 0
  const markup = p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.costPrice) * 100 : 0
  return { commissionAmount, taxAmount, feeFixed: mp.feeFixed, totalCost, profit, margin, markup }
}

export default function PrecificadorPage() {
  const [products, setProducts] = useState<Product[]>([emptyProduct()])
  const [customCommission, setCustomCommission] = useState(12)

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const addProduct = () => setProducts(ps => [...ps, emptyProduct()])

  const removeProduct = (id: string) => {
    if (products.length <= 1) return
    setProducts(ps => ps.filter(p => p.id !== id))
  }

  const resetAll = () => setProducts([emptyProduct()])

  const summary = useMemo(() => {
    const calcs = products.map(p => {
      const effectiveP = p.marketplace === 'custom'
        ? { ...p, marketplace: 'custom' }
        : p
      return calcProduct(effectiveP)
    })
    const totalRevenue = products.reduce((s, p) => s + p.salePrice, 0)
    const totalCost = calcs.reduce((s, c) => s + c.totalCost, 0)
    const totalProfit = calcs.reduce((s, c) => s + c.profit, 0)
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    return { totalRevenue, totalCost, totalProfit, avgMargin, calcs }
  }, [products, customCommission])

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width,240px)] sidebar-transition">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calculator className="h-6 w-6 text-rose-400" />
                Precificador
              </h1>
              <p className="text-sm text-white/30 mt-1">Descubra se terá lucro antes de anunciar</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <RotateCcw className="h-3.5 w-3.5" /> Limpar
              </button>
              <button onClick={addProduct}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-blue-400 text-white shadow-md shadow-primary/30 hover:shadow-primary/50 transition-all">
                <Plus className="h-3.5 w-3.5" /> Adicionar produto
              </button>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Receita Total', value: fmt(summary.totalRevenue), icon: DollarSign, color: 'text-blue-400' },
              { label: 'Custo Total', value: fmt(summary.totalCost), icon: ShoppingBag, color: 'text-amber-400' },
              { label: 'Lucro Total', value: fmt(summary.totalProfit), icon: summary.totalProfit >= 0 ? TrendingUp : TrendingDown, color: summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Margem Média', value: fmtPct(summary.avgMargin), icon: Percent, color: summary.avgMargin >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map((kpi, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                  <span className="text-xs text-white/30">{kpi.label}</span>
                </div>
                <p className={cn('text-xl font-bold font-mono', kpi.color)}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Products */}
          <div className="space-y-4">
            {products.map((product, idx) => {
              const effectiveMP = product.marketplace === 'custom'
                ? { ...MARKETPLACE_FEES.custom, commission: customCommission }
                : MARKETPLACE_FEES[product.marketplace]
              const calc = product.marketplace === 'custom'
                ? calcProduct({ ...product })
                : calcProduct(product)
              // Recalc for custom
              const commAmt = (product.salePrice * (effectiveMP?.commission ?? 0)) / 100
              const taxAmt = (product.salePrice * product.taxRate) / 100
              const feeF = effectiveMP?.feeFixed ?? 0
              const totalC = product.costPrice + commAmt + taxAmt + feeF + product.shippingCost
              const profit = product.salePrice - totalC
              const margin = product.salePrice > 0 ? (profit / product.salePrice) * 100 : 0

              return (
                <div key={product.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  {/* Product header */}
                  <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white/15">#{idx + 1}</span>
                      <input
                        placeholder="Nome do produto (opcional)"
                        value={product.name}
                        onChange={e => updateProduct(product.id, 'name', e.target.value)}
                        className="bg-transparent text-sm font-medium text-white placeholder:text-white/15 outline-none w-60"
                      />
                    </div>
                    {products.length > 1 && (
                      <button onClick={() => removeProduct(product.id)}
                        className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Input row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                      <div>
                        <label className="text-[10px] font-medium text-white/25 mb-1 block">Custo fornecedor (R$)</label>
                        <Input type="number" step="0.01" value={product.costPrice || ''}
                          onChange={e => updateProduct(product.id, 'costPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-white/25 mb-1 block">Preço de venda (R$)</label>
                        <Input type="number" step="0.01" value={product.salePrice || ''}
                          onChange={e => updateProduct(product.id, 'salePrice', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-white/25 mb-1 block">Imposto (%)</label>
                        <Input type="number" step="0.1" value={product.taxRate || ''}
                          onChange={e => updateProduct(product.id, 'taxRate', parseFloat(e.target.value) || 0)}
                          placeholder="6"
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-white/25 mb-1 block">Frete (R$)</label>
                        <Input type="number" step="0.01" value={product.shippingCost || ''}
                          onChange={e => updateProduct(product.id, 'shippingCost', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-white/25 mb-1 block">Marketplace</label>
                        <select value={product.marketplace}
                          onChange={e => updateProduct(product.id, 'marketplace', e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary">
                          {Object.entries(MARKETPLACE_FEES).map(([k, v]) => (
                            <option key={k} value={k} className="bg-[#0c1220]">{v.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {product.marketplace === 'custom' && (
                      <div className="mb-5 flex items-center gap-3">
                        <label className="text-[10px] font-medium text-white/25">Comissão personalizada (%)</label>
                        <Input type="number" step="0.1" value={customCommission}
                          onChange={e => setCustomCommission(parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white/[0.04] border-white/[0.08] text-white font-mono" />
                      </div>
                    )}

                    {/* Breakdown */}
                    {product.salePrice > 0 && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider">Deduções</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/30">Comissão {effectiveMP?.label} ({effectiveMP?.commission}%)</span>
                            <span className="text-red-400 font-mono">- {fmt(commAmt)}</span>
                          </div>
                          {feeF > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-white/30">Taxa fixa</span>
                              <span className="text-red-400 font-mono">- {fmt(feeF)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-white/30">Imposto ({product.taxRate}%)</span>
                            <span className="text-red-400 font-mono">- {fmt(taxAmt)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/30">Custo do produto</span>
                            <span className="text-red-400 font-mono">- {fmt(product.costPrice)}</span>
                          </div>
                          {product.shippingCost > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-white/30">Frete</span>
                              <span className="text-red-400 font-mono">- {fmt(product.shippingCost)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs pt-2 border-t border-white/[0.06]">
                            <span className="text-white/40 font-medium">Total de custos</span>
                            <span className="text-white/60 font-mono font-bold">{fmt(totalC)}</span>
                          </div>
                        </div>

                        <div className={cn(
                          'rounded-xl p-4 flex items-center justify-between',
                          profit >= 0
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        )}>
                          <div>
                            <p className={cn('text-xs', profit >= 0 ? 'text-emerald-400/60' : 'text-red-400/60')}>
                              {profit >= 0 ? 'Lucro líquido' : 'Prejuízo'}
                            </p>
                            <p className={cn('text-2xl font-black', profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {fmt(profit)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn('text-xs', profit >= 0 ? 'text-emerald-400/60' : 'text-red-400/60')}>Margem</p>
                            <p className={cn('text-xl font-bold', profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {fmtPct(margin)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
