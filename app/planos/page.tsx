'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Check, Crown, Star, Zap, Gem, ArrowRight, Loader2,
  ShoppingBag, BarChart3, Megaphone, MessageSquare, Users,
  Rocket, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  features: string
  maxAccounts: number
}

const PLAN_STYLE: Record<string, { icon: React.ElementType; gradient: string; badge?: string; ring: string }> = {
  Starter:       { icon: Zap,   gradient: 'from-slate-500 to-slate-400', ring: 'ring-slate-500/20' },
  Professional:  { icon: Star,  gradient: 'from-blue-600 to-blue-400',  badge: 'Mais popular', ring: 'ring-blue-500/30' },
  Business:      { icon: Crown, gradient: 'from-purple-600 to-purple-400', ring: 'ring-purple-500/20' },
  Enterprise:    { icon: Gem,   gradient: 'from-amber-500 to-yellow-400', ring: 'ring-amber-500/20' },
}

const HIGHLIGHTS = [
  { icon: ShoppingBag,   label: 'Vendas em tempo real',       desc: 'Acompanhe cada venda dos seus marketplaces' },
  { icon: BarChart3,     label: 'Dashboard completo',         desc: 'Métricas unificadas de todas as operações' },
  { icon: Megaphone,     label: 'Gestão de anúncios',         desc: 'Performance de campanhas por marketplace' },
  { icon: MessageSquare, label: 'Avaliações centralizadas',   desc: 'Feedbacks de clientes em um só lugar' },
  { icon: Users,         label: 'Multi-usuários',             desc: 'Assessoria e equipe com acessos dedicados' },
  { icon: Shield,        label: 'Dados seguros',              desc: 'Criptografia e backups automáticos' },
]

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => { setPlans(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#060b14] text-white">

      {/* ── Nav ── */}
      <nav className="border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50 bg-[#060b14]/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <span className="text-[11px] font-black text-white">M</span>
            </div>
            <span className="text-[15px] font-black tracking-tight">merly</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">Entrar</Link>
            <Link href="/cadastro" className="text-sm font-semibold bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors">
              Teste grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-6">
            <Rocket className="h-3.5 w-3.5" /> 14 dias grátis em todos os planos
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Escolha o plano ideal<br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">para sua operação</span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto mb-8">
            Gerencie seus marketplaces em um só lugar. Mercado Livre, Shopee e Amazon integrados com dados em tempo real.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/[0.08] rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn('px-5 py-2 rounded-full text-sm font-medium transition-all', billing === 'monthly' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/40 hover:text-white/70')}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={cn('px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5', billing === 'yearly' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/40 hover:text-white/70')}
            >
              Anual <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Plans grid ── */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const style = PLAN_STYLE[plan.name] ?? PLAN_STYLE.Starter
              const Icon = style.icon
              const features: string[] = (() => { try { return JSON.parse(plan.features) } catch { return [] } })()
              const price = billing === 'yearly' ? plan.price * 0.8 : plan.price
              const isPopular = plan.name === 'Professional'
              const isEnterprise = plan.name === 'Enterprise'

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-2xl border bg-white/[0.02] p-6 flex flex-col transition-all hover:scale-[1.02] hover:shadow-2xl',
                    isPopular ? 'border-primary/40 ring-2 ring-primary/20 shadow-lg shadow-primary/10' : 'border-white/[0.08]'
                  )}
                >
                  {style.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold bg-primary text-white px-3 py-1 rounded-full shadow-lg shadow-primary/40 whitespace-nowrap">
                        {style.badge}
                      </span>
                    </div>
                  )}

                  <div className={cn('h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4', style.gradient)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-[11px] text-white/25 mb-4">Até {plan.maxAccounts} marketplace{plan.maxAccounts > 1 ? 's' : ''}</p>

                  <div className="mb-5">
                    {isEnterprise ? (
                      <div>
                        <p className="text-2xl font-black">Sob consulta</p>
                        <p className="text-[11px] text-white/25 mt-0.5">Plano personalizado</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-white/40">R$</span>
                          <span className="text-3xl font-black">{Math.round(price)}</span>
                          <span className="text-sm text-white/25">/{billing === 'monthly' ? 'mês' : 'mês'}</span>
                        </div>
                        {billing === 'yearly' && (
                          <p className="text-[10px] text-emerald-400 mt-0.5">
                            R$ {Math.round(price * 12).toLocaleString('pt-BR')}/ano — economize R$ {Math.round(plan.price * 12 * 0.2).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/cadastro?plano=${plan.id}`}
                    className={cn(
                      'flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mb-5',
                      isPopular
                        ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-md shadow-primary/30 hover:shadow-primary/50'
                        : isEnterprise
                          ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    )}
                  >
                    {isEnterprise ? 'Falar com vendas' : 'Começar grátis'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="flex-1 space-y-2.5">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-[12px] text-white/50 leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Features ── */}
      <div className="border-t border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Tudo que você precisa para escalar</h2>
            <p className="text-sm text-white/30">Funcionalidades incluídas em todos os planos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HIGHLIGHTS.map((h, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-primary/20 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <h.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{h.label}</h3>
                <p className="text-xs text-white/30">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Pronto para unificar seus marketplaces?</h2>
          <p className="text-sm text-white/30 mb-6">Comece seu teste grátis de 14 dias. Sem cartão de crédito.</p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-400 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
          >
            <Rocket className="h-4 w-4" /> Criar conta grátis
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-white/20">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <span className="text-[8px] font-black text-white">M</span>
            </div>
            <span>merly &copy; {new Date().getFullYear()}</span>
          </div>
          <span>Gestão unificada de marketplaces</span>
        </div>
      </footer>
    </div>
  )
}
