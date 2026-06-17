'use client'

import Link from 'next/link'
import {
  BarChart3, TrendingUp, DollarSign, Shield, Search, Target,
  Star, ArrowRight, CheckCircle2, Zap, Users, Calculator,
  ShoppingBag, Award, AlertTriangle, ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

const FEATURES = [
  {
    num: '01',
    title: 'Dashboard Financeiro Completo',
    desc: 'Acompanhe SKUs, anúncios ativos, vendas totais, itens vendidos, custos, tarifas, impostos e ticket médio em tempo real.',
    icon: BarChart3,
    color: 'from-blue-500 to-blue-400',
  },
  {
    num: '02',
    title: 'Score de Atividade da Conta',
    desc: 'Identifique oportunidades: monitore anúncios sem vendas e ajuste suas estratégias para melhorar resultados.',
    icon: Target,
    color: 'from-emerald-500 to-emerald-400',
  },
  {
    num: '03',
    title: 'Monitoramento de Reputação',
    desc: 'Acompanhe mediações, cancelamentos, atrasos no envio, reclamações e mais. Proteja sua conta.',
    icon: Shield,
    color: 'from-amber-500 to-amber-400',
  },
  {
    num: '04',
    title: 'Análise de Concorrentes',
    desc: 'Diagnóstico completo do concorrente com um clique. Faturamento, vendas e estratégias em tempo real.',
    icon: Search,
    color: 'from-purple-500 to-purple-400',
  },
  {
    num: '05',
    title: 'Precificador Automático',
    desc: 'Descubra se terá lucro antes de anunciar. Informe custo, imposto e preço alvo — veja a margem instantaneamente.',
    icon: Calculator,
    color: 'from-rose-500 to-rose-400',
  },
  {
    num: '06',
    title: 'Multi-Marketplace',
    desc: 'Mercado Livre, Shopee e Amazon integrados. Dados unificados de todas as suas operações em um só lugar.',
    icon: ShoppingBag,
    color: 'from-cyan-500 to-cyan-400',
  },
]

const BENEFITS = [
  'Dashboard com métricas em tempo real',
  'Score de atividade da conta',
  'Monitoramento de reputação completo',
  'Precificador automático integrado',
  'Análise de concorrentes com 1 clique',
  'DRE — Resultado financeiro do exercício',
  'Dados de vendas e avaliações centralizados',
  'Suporte dedicado',
]

const FAQ = [
  {
    q: 'O preço aumenta conforme minhas vendas crescem?',
    a: 'Não. O valor da assinatura é fixo, independente do seu volume de vendas ou faturamento.',
  },
  {
    q: 'Quantas contas de marketplace posso vincular?',
    a: 'Você pode vincular até 3 contas de marketplace por assinatura (Mercado Livre, Shopee e/ou Amazon).',
  },
  {
    q: 'As atualizações são cobradas à parte?',
    a: 'Não. Todas as atualizações e novas funcionalidades são incluídas sem custo adicional na sua assinatura.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Não há fidelidade. Você pode cancelar sua assinatura quando quiser, sem multas ou taxas.',
  },
]

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [billingAnual, setBillingAnual] = useState(true)

  return (
    <div className="min-h-screen bg-[#060b14] text-white">

      {/* ── Nav ── */}
      <nav className="border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50 bg-[#060b14]/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-xs font-black text-white">M</span>
            </div>
            <span className="text-lg font-black tracking-tight">merly</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors px-3 py-2">
              Entrar
            </Link>
            <Link href="/cadastro" className="text-sm font-bold bg-gradient-to-r from-primary to-blue-400 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all">
              QUERO ESCALAR MINHAS VENDAS
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-8">
            <Zap className="h-3.5 w-3.5" /> + de 10.000 vendedores já usam
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Domine seus marketplaces<br />
            com análise <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">fácil, rápida e poderosa!</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/35 max-w-2xl mx-auto mb-10 leading-relaxed">
            Chega de adivinhações. Tome decisões estratégicas baseadas em dados reais.
            Dashboard financeiro, análise de concorrentes e precificador automático.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/cadastro"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-400 text-white px-8 py-4 rounded-xl text-base font-black shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all">
              COMECE A ESCALAR <ArrowRight className="h-5 w-5" />
            </Link>
            <span className="text-sm text-white/20">7 dias grátis para experimentar</span>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-14 opacity-30">
            {['Mercado Livre', 'Shopee', 'Amazon'].map(mp => (
              <span key={mp} className="text-sm font-bold tracking-wide">{mp}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">Tudo que você precisa para escalar</h2>
            <p className="text-white/30">Ferramentas poderosas que transformam dados em resultados</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.num} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-black text-white/15">{f.num}</span>
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-white/30 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Precificador Preview ── */}
      <div className="border-t border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full mb-4">
                <Calculator className="h-3 w-3" /> Precificador Automático
              </div>
              <h2 className="text-3xl font-black mb-4">
                Descubra seu lucro<br />
                <span className="text-rose-400">antes de anunciar</span>
              </h2>
              <p className="text-white/30 mb-6 leading-relaxed">
                Informe apenas o preço do fornecedor, alíquota de imposto e preço alvo.
                Saiba instantaneamente se terá lucro, considerando todas as taxas do marketplace.
              </p>
              <Link href="/cadastro"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-white transition-colors">
                Experimentar grátis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                  <p className="text-[10px] text-white/25 mb-1">Custo fornecedor</p>
                  <p className="text-lg font-bold text-white">R$ 45,00</p>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                  <p className="text-[10px] text-white/25 mb-1">Imposto</p>
                  <p className="text-lg font-bold text-white">6%</p>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                  <p className="text-[10px] text-white/25 mb-1">Preço de venda</p>
                  <p className="text-lg font-bold text-primary">R$ 129,90</p>
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/30">Comissão marketplace (16%)</span>
                  <span className="text-xs text-red-400 font-mono">- R$ 20,78</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/30">Imposto (6%)</span>
                  <span className="text-xs text-red-400 font-mono">- R$ 7,79</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/30">Custo do produto</span>
                  <span className="text-xs text-red-400 font-mono">- R$ 45,00</span>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-emerald-400/60">Lucro líquido</p>
                  <p className="text-2xl font-black text-emerald-400">R$ 56,33</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400/60">Margem</p>
                  <p className="text-xl font-bold text-emerald-400">43,4%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Benefits ── */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Incluso em todos os planos</h2>
            <p className="text-white/30">Sem surpresas. Preço fixo independente do volume de vendas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm text-white/50">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing ── */}
      <div className="border-t border-white/[0.04] bg-white/[0.01]" id="planos">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Planos simples e transparentes</h2>
            <p className="text-white/30">Comece grátis por 7 dias. Cancele quando quiser.</p>

            {/* Toggle Mensal / Anual */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm font-semibold transition-colors ${!billingAnual ? 'text-white' : 'text-white/30'}`}>Mensal</span>
              <button onClick={() => setBillingAnual(!billingAnual)}
                className="relative h-7 w-14 rounded-full bg-white/10 border border-white/[0.08] transition-colors focus:outline-none"
                aria-label="Alternar plano">
                <div className={`absolute top-0.5 h-6 w-6 rounded-full transition-all duration-300 ${billingAnual ? 'left-[calc(100%-1.625rem)] bg-gradient-to-r from-primary to-blue-400 shadow-lg shadow-primary/40' : 'left-0.5 bg-white/40'}`} />
              </button>
              <span className={`text-sm font-semibold transition-colors ${billingAnual ? 'text-white' : 'text-white/30'}`}>
                Anual
              </span>
              {billingAnual && (
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  -39% OFF
                </span>
              )}
            </div>
          </div>

          {/* Single plan card */}
          <div className="max-w-md mx-auto">
            <div className={`relative rounded-2xl p-8 flex flex-col ${billingAnual ? 'border border-primary/40 ring-2 ring-primary/20 bg-white/[0.03] shadow-lg shadow-primary/10' : 'border border-white/[0.08] bg-white/[0.02]'}`}>
              {billingAnual && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold bg-gradient-to-r from-primary to-blue-400 text-white px-4 py-1 rounded-full shadow-lg shadow-primary/40 whitespace-nowrap">
                    Mais popular — Economize R$ 456/ano
                  </span>
                </div>
              )}
              <h3 className="text-lg font-bold mb-1">{billingAnual ? 'Plano Anual' : 'Plano Mensal'}</h3>
              <p className="text-xs text-white/25 mb-5">{billingAnual ? 'Cobrado anualmente (R$ 718,80/ano)' : 'Sem compromisso, cancele quando quiser'}</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white/40">R$</span>
                  <span className="text-5xl font-black">{billingAnual ? '59' : '97'}</span>
                  <span className="text-2xl font-bold">,90</span>
                  <span className="text-sm text-white/25">/mês</span>
                </div>
                {billingAnual && <p className="text-[11px] text-emerald-400 mt-1">Economize R$ 38,00/mês em relação ao mensal</p>}
              </div>
              <Link href={`/cadastro?plano=${billingAnual ? 'anual' : 'mensal'}`}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all mb-6 ${billingAnual ? 'bg-gradient-to-r from-primary to-blue-400 text-white shadow-md shadow-primary/30 hover:shadow-primary/50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                Começar 7 dias grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="space-y-2.5">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-white/40">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-black text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-white/70">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 text-white/20 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-white/35 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="border-t border-white/[0.04] bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-black mb-4">
            Pronto para dominar seus<br />marketplaces?
          </h2>
          <p className="text-white/30 mb-8 max-w-lg mx-auto">
            Junte-se a milhares de vendedores que já tomam decisões baseadas em dados reais.
            Teste grátis por 7 dias.
          </p>
          <Link href="/cadastro"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-400 text-white px-10 py-4 rounded-xl text-base font-black shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all">
            QUERO ESCALAR MINHAS VENDAS <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <span className="text-[8px] font-black text-white">M</span>
            </div>
            <span>merly &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Análise inteligente de marketplaces</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
