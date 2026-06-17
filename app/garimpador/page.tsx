'use client'

import { useState } from 'react'
import {
  Search, Loader2, TrendingUp, DollarSign, Tag, Users2, Package,
  ExternalLink, Truck, Award, BarChart3, Hash, Type, ArrowUpDown,
  Sparkles, Target, ShoppingBag, Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface GarimpadorResult {
  query: string
  totalResults: number
  analyzedCount: number
  priceAnalysis: {
    min: number; max: number; avg: number; median: number; p25: number; p75: number
  } | null
  keywords: { word: string; count: number; pct: number }[]
  bigrams: { phrase: string; count: number; pct: number }[]
  titlePatterns: { avgLength: number; avgWords: number; minLength: number; maxLength: number }
  topSellers: { name: string; items: number; totalSold: number }[]
  topListings: {
    id: string; title: string; price: number; sold: number; thumbnail: string
    permalink: string; freeShipping: boolean; seller: string; condition: string; type: string
    location: string | null
  }[]
  categories: { id: string; name: string; count: number }[]
  stats: { totalSold: number; avgSoldPerListing: number; freeShippingPct: number; premiumListingPct: number }
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtNum = (v: number) => v.toLocaleString('pt-BR')

type Tab = 'keywords' | 'listings' | 'sellers' | 'prices'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'keywords', label: 'Palavras-chave',  icon: Hash },
  { key: 'listings', label: 'Top Anúncios',    icon: ShoppingBag },
  { key: 'sellers',  label: 'Vendedores',       icon: Users2 },
  { key: 'prices',   label: 'Análise de Preço', icon: DollarSign },
]

export default function GarimpadorPage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('relevance')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GarimpadorResult | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('keywords')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/garimpador?q=${encodeURIComponent(query.trim())}&sort=${sort}&limit=50`)
      if (!res.ok) { setError('Erro ao realizar pesquisa'); setLoading(false); return }
      setResult(await res.json())
      setTab('keywords')
    } catch { setError('Erro de conexão') }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width,240px)] sidebar-transition">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Garimpador</h1>
                <p className="text-sm text-white/30">Pesquisa competitiva e análise de SEO de anúncios</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <Input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Pesquisar produto, nicho ou palavra-chave..."
                  className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-11" />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-xl px-3 h-11 outline-none">
                <option value="relevance">Relevância</option>
                <option value="sold_quantity_desc">Mais vendidos</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
              <Button type="submit" disabled={loading || !query.trim()} className="h-11 px-6">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Garimpar
              </Button>
            </div>
          </form>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
              <p className="text-sm text-white/30">Garimpando dados do Mercado Livre...</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Stats overview */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'Resultados encontrados', value: fmtNum(result.totalResults), icon: Search, color: 'text-blue-400' },
                  { label: 'Total de vendas', value: fmtNum(result.stats.totalSold), icon: ShoppingBag, color: 'text-emerald-400' },
                  { label: 'Preço médio', value: result.priceAnalysis ? fmt(result.priceAnalysis.avg) : '—', icon: DollarSign, color: 'text-amber-400' },
                  { label: 'Frete grátis', value: `${result.stats.freeShippingPct}%`, icon: Truck, color: 'text-purple-400' },
                  { label: 'Anúncios premium', value: `${result.stats.premiumListingPct}%`, icon: Crown, color: 'text-rose-400' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className={cn('h-3.5 w-3.5', s.color)} />
                      <span className="text-[10px] text-white/25 uppercase tracking-wider">{s.label}</span>
                    </div>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Categories found */}
              {result.categories.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-white/30 mb-2">Categorias relacionadas</p>
                  <div className="flex flex-wrap gap-2">
                    {result.categories.map(c => (
                      <span key={c.id} className="text-[11px] bg-white/[0.04] border border-white/[0.08] text-white/50 px-2.5 py-1 rounded-lg">
                        {c.name} <span className="text-white/20">({fmtNum(c.count)})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mb-6 border-b border-white/[0.06] -mx-1">
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative',
                      tab === t.key ? 'text-white' : 'text-white/30 hover:text-white/60'
                    )}>
                    <t.icon className="h-4 w-4" />
                    {t.label}
                    {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
                  </button>
                ))}
              </div>

              {/* ═══ TAB: Palavras-chave ═══ */}
              {tab === 'keywords' && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Keywords */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                      <Hash className="h-4 w-4 text-amber-400" />
                      <h2 className="text-sm font-semibold text-white">Palavras mais usadas nos títulos</h2>
                    </div>
                    <div className="p-4 space-y-1.5 max-h-[500px] overflow-y-auto">
                      {result.keywords.map((kw, i) => (
                        <div key={kw.word} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.02]">
                          <span className="text-xs font-bold text-white/15 w-5 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white truncate">{kw.word}</span>
                              <span className="text-xs text-white/30 shrink-0 ml-2">{kw.count}x · {kw.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400/60 rounded-full" style={{ width: `${kw.pct}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bigrams + Title patterns */}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                        <Type className="h-4 w-4 text-blue-400" />
                        <h2 className="text-sm font-semibold text-white">Expressões frequentes (2 palavras)</h2>
                      </div>
                      <div className="p-4 space-y-1.5">
                        {result.bigrams.length > 0 ? result.bigrams.map((bg, i) => (
                          <div key={bg.phrase} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-white/15 w-5 text-right">{i + 1}</span>
                              <span className="text-sm text-white/70">{bg.phrase}</span>
                            </div>
                            <span className="text-xs text-white/30">{bg.count}x · {bg.pct}%</span>
                          </div>
                        )) : (
                          <p className="text-sm text-white/15 py-4 text-center">Nenhuma expressão recorrente encontrada</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-400" />
                        <h2 className="text-sm font-semibold text-white">Padrão dos títulos</h2>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                            <p className="text-[10px] text-white/25 mb-1">Comprimento médio</p>
                            <p className="text-lg font-bold text-white">{result.titlePatterns.avgLength} <span className="text-xs text-white/20">chars</span></p>
                          </div>
                          <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                            <p className="text-[10px] text-white/25 mb-1">Palavras por título</p>
                            <p className="text-lg font-bold text-white">{result.titlePatterns.avgWords} <span className="text-xs text-white/20">palavras</span></p>
                          </div>
                        </div>
                        <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
                          <p className="text-xs font-semibold text-amber-400 mb-1">Dica de SEO</p>
                          <p className="text-xs text-white/40 leading-relaxed">
                            Os títulos dos concorrentes têm em média {result.titlePatterns.avgWords} palavras ({result.titlePatterns.avgLength} caracteres).
                            Use as palavras-chave mais frequentes no início do título para melhor ranqueamento.
                            O Mercado Livre permite até 60 caracteres — maximize o uso.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ TAB: Top Anúncios ═══ */}
              {tab === 'listings' && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <h2 className="text-sm font-semibold text-white">Anúncios mais vendidos</h2>
                    </div>
                    <span className="text-xs text-white/20">{result.topListings.length} anúncios</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {result.topListings.map((item, i) => (
                      <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
                        <span className="text-sm font-bold text-white/10 w-6 text-center shrink-0">{i + 1}</span>
                        <img src={item.thumbnail} alt="" className="h-14 w-14 rounded-xl object-cover bg-white/5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <a href={item.permalink} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-white hover:text-primary transition-colors line-clamp-2 flex items-start gap-1">
                            {item.title}
                            <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 text-white/15" />
                          </a>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-white/25">{item.seller}</span>
                            {item.freeShipping && (
                              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Frete grátis</span>
                            )}
                            {item.type === 'gold_pro' && (
                              <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Premium</span>
                            )}
                            {item.condition === 'new' && (
                              <span className="text-[10px] text-white/20">Novo</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-white">{fmt(item.price)}</p>
                          <p className="text-xs text-emerald-400">{fmtNum(item.sold)} vendidos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TAB: Vendedores ═══ */}
              {tab === 'sellers' && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-purple-400" />
                    <h2 className="text-sm font-semibold text-white">Vendedores dominantes neste nicho</h2>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {result.topSellers.map((seller, i) => {
                      const maxSold = result.topSellers[0]?.totalSold || 1
                      return (
                        <div key={seller.name} className="px-6 py-4 hover:bg-white/[0.01] transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-white/10 w-6 text-center">{i + 1}</span>
                              <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-sm font-bold text-purple-400">
                                {seller.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{seller.name}</p>
                                <p className="text-xs text-white/20">{seller.items} anúncio{seller.items !== 1 ? 's' : ''} neste nicho</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">{fmtNum(seller.totalSold)}</p>
                              <p className="text-xs text-white/20">vendidos</p>
                            </div>
                          </div>
                          <div className="ml-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400/50 rounded-full" style={{ width: `${(seller.totalSold / maxSold) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ═══ TAB: Análise de Preço ═══ */}
              {tab === 'prices' && result.priceAnalysis && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: 'Menor preço', value: fmt(result.priceAnalysis.min), color: 'text-emerald-400' },
                      { label: 'Preço mediano', value: fmt(result.priceAnalysis.median), color: 'text-blue-400' },
                      { label: 'Maior preço', value: fmt(result.priceAnalysis.max), color: 'text-red-400' },
                      { label: 'Preço médio', value: fmt(result.priceAnalysis.avg), color: 'text-amber-400' },
                      { label: 'Percentil 25%', value: fmt(result.priceAnalysis.p25), color: 'text-white/50' },
                      { label: 'Percentil 75%', value: fmt(result.priceAnalysis.p75), color: 'text-white/50' },
                    ].map((p, i) => (
                      <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{p.label}</p>
                        <p className={cn('text-xl font-bold', p.color)}>{p.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <h2 className="text-sm font-semibold text-white">Distribuição de preço</h2>
                    </div>
                    <div className="relative h-12 bg-white/5 rounded-xl overflow-hidden">
                      <div className="absolute h-full bg-emerald-500/20 rounded-l-xl"
                        style={{ left: '0%', width: `${((result.priceAnalysis.p25 - result.priceAnalysis.min) / (result.priceAnalysis.max - result.priceAnalysis.min)) * 100}%` }} />
                      <div className="absolute h-full bg-blue-500/20"
                        style={{
                          left: `${((result.priceAnalysis.p25 - result.priceAnalysis.min) / (result.priceAnalysis.max - result.priceAnalysis.min)) * 100}%`,
                          width: `${((result.priceAnalysis.p75 - result.priceAnalysis.p25) / (result.priceAnalysis.max - result.priceAnalysis.min)) * 100}%`
                        }} />
                      <div className="absolute h-full bg-red-500/20 rounded-r-xl"
                        style={{
                          left: `${((result.priceAnalysis.p75 - result.priceAnalysis.min) / (result.priceAnalysis.max - result.priceAnalysis.min)) * 100}%`,
                          width: `${((result.priceAnalysis.max - result.priceAnalysis.p75) / (result.priceAnalysis.max - result.priceAnalysis.min)) * 100}%`
                        }} />
                      <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                        style={{ left: `${((result.priceAnalysis.median - result.priceAnalysis.min) / (result.priceAnalysis.max - result.priceAnalysis.min)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-white/20">
                      <span>{fmt(result.priceAnalysis.min)}</span>
                      <span className="text-amber-400">Mediana: {fmt(result.priceAnalysis.median)}</span>
                      <span>{fmt(result.priceAnalysis.max)}</span>
                    </div>

                    <div className="mt-6 rounded-xl bg-blue-500/5 border border-blue-500/15 p-3">
                      <p className="text-xs font-semibold text-blue-400 mb-1">Insight de preço</p>
                      <p className="text-xs text-white/40 leading-relaxed">
                        A faixa competitiva fica entre {fmt(result.priceAnalysis.p25)} e {fmt(result.priceAnalysis.p75)}.
                        Precificar nessa faixa coloca você entre os 50% do meio do mercado.
                        O preço mediano ({fmt(result.priceAnalysis.median)}) é o ponto de equilíbrio ideal para competir.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center mb-6">
                <Sparkles className="h-10 w-10 text-amber-400/40" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Garimpe oportunidades</h2>
              <p className="text-sm text-white/30 max-w-md leading-relaxed">
                Pesquise um produto ou nicho para analisar palavras-chave, preços, concorrentes
                e padrões de SEO dos anúncios mais vendidos no Mercado Livre.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
