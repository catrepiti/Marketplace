'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Check, ArrowRight, Loader2, Rocket, Zap, CheckCircle2, ChevronDown,
  BarChart3, Calculator, ShieldAlert, Search, ShoppingBag, Star,
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

const BENEFITS = [
  { icon: BarChart3,   label: 'Dashboard financeiro completo' },
  { icon: Zap,         label: 'Score de atividade da conta' },
  { icon: ShieldAlert, label: 'Monitoramento de reputação' },
  { icon: Calculator,  label: 'Precificador automático' },
  { icon: Search,      label: 'Análise de concorrentes' },
  { icon: ShoppingBag, label: 'Multi-marketplace integrado' },
]

const FAQ = [
  { q: 'O preço aumenta conforme minhas vendas crescem?', a: 'Não. O valor da assinatura é fixo, independente do seu volume de vendas ou faturamento.' },
  { q: 'Quantas contas de marketplace posso vincular?', a: 'Até 3 contas de marketplace por assinatura (Mercado Livre, Shopee e/ou Amazon).' },
  { q: 'As atualizações são cobradas à parte?', a: 'Não. Todas as atualizações e novas funcionalidades são incluídas sem custo adicional.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Não há fidelidade. Cancele quando quiser, sem multas ou taxas.' },
]

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => { setPlans(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const semestral = plans.find(p => p.name === 'Semestral')
  const anual = plans.find(p => p.name === 'Anual')

  return (
    <div className="min-h-screen bg-[#060b14] text-white">

      {/* Nav */}
      <nav className="border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50 bg-[#060b14]/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <span className="text-[11px] font-black text-white">M</span>
            </div>
            <span className="text-[15px] font-black tracking-tight">merly</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors">Entrar</Link>
            <Link href="/cadastro" className="text-sm font-bold bg-gradient-to-r from-primary to-blue-400 text-white px-5 py-2 rounded-xl shadow-lg shadow-primary/30">
              Teste grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-6">
            <Rocket className="h-3.5 w-3.5" /> 7 dias grátis em todos os planos
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Planos simples e<br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">transparentes</span>
          </h1>
          <p className="text-lg text-white/35 max-w-xl mx-auto">
            Preço fixo independente do volume de vendas. Todas as funcionalidades incluídas.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Semestral */}
            {semestral && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col">
                <h3 className="text-lg font-bold mb-1">Semestral</h3>
                <p className="text-xs text-white/25 mb-5">Compromisso de 6 meses</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-sm text-white/40">R$</span>
                  <span className="text-4xl font-black">89</span>
                  <span className="text-xl font-bold">,90</span>
                  <span className="text-sm text-white/25">/mês</span>
                </div>
                <Link href={`/cadastro?plano=${semestral.id}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all mb-5">
                  Começar 7 dias grátis <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex-1 space-y-2.5">
                  {(() => { try { return JSON.parse(semestral.features) as string[] } catch { return [] } })().map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-white/40">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anual */}
            {anual && (
              <div className="relative rounded-2xl border border-primary/40 ring-2 ring-primary/20 bg-white/[0.03] p-7 flex flex-col shadow-lg shadow-primary/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold bg-gradient-to-r from-primary to-blue-400 text-white px-4 py-1 rounded-full shadow-lg shadow-primary/40 whitespace-nowrap">
                    30% OFF — Mais popular
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">Anual</h3>
                <p className="text-xs text-white/25 mb-5">Compromisso de 12 meses</p>
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-white/40">R$</span>
                    <span className="text-4xl font-black">59</span>
                    <span className="text-xl font-bold">,90</span>
                    <span className="text-sm text-white/25">/mês</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1">Economize R$ 360/ano</p>
                </div>
                <Link href={`/cadastro?plano=${anual.id}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-blue-400 text-white shadow-md shadow-primary/30 hover:shadow-primary/50 transition-all mb-5">
                  Começar 7 dias grátis <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex-1 space-y-2.5">
                  {(() => { try { return JSON.parse(anual.features) as string[] } catch { return [] } })().map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-white/40">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features grid */}
      <div className="border-t border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Incluso em todos os planos</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-white/50">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-sm font-semibold text-white/70">{item.q}</span>
                  <ChevronDown className={cn('h-4 w-4 text-white/20 transition-transform', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-white/35">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Pronto para escalar suas vendas?</h2>
          <p className="text-sm text-white/30 mb-6">Teste grátis por 7 dias. Sem cartão de crédito.</p>
          <Link href="/cadastro"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-400 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all">
            <Rocket className="h-4 w-4" /> QUERO ESCALAR MINHAS VENDAS
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-white/20">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <span className="text-[8px] font-black text-white">M</span>
            </div>
            <span>merly &copy; {new Date().getFullYear()}</span>
          </div>
          <span>Análise inteligente de marketplaces</span>
        </div>
      </footer>
    </div>
  )
}
