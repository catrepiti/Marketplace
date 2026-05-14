'use client'
import { DollarSign, TrendingUp, Eye, MousePointer, Target, Percent, ShoppingBag, BarChart2, Megaphone } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { cn, formatCurrency } from '@/lib/utils'

const kpis = [
  { icon: DollarSign,    label: 'Investimento Total', value: 'R$ 0,00', border: 'border-violet-500/20',  bg: 'bg-violet-500/10',  color: 'text-violet-400',  glow: 'from-violet-500/10'  },
  { icon: TrendingUp,    label: 'ROAS',               value: '0x',      border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', color: 'text-emerald-400', glow: 'from-emerald-500/10' },
  { icon: Eye,           label: 'Impressões',         value: '0',       border: 'border-blue-500/20',    bg: 'bg-blue-500/10',    color: 'text-blue-400',    glow: 'from-blue-500/10'    },
  { icon: MousePointer,  label: 'Cliques',            value: '0',       border: 'border-cyan-500/20',    bg: 'bg-cyan-500/10',    color: 'text-cyan-400',    glow: 'from-cyan-500/10'    },
  { icon: BarChart2,     label: 'CTR Médio',          value: '0%',      border: 'border-amber-500/20',   bg: 'bg-amber-500/10',   color: 'text-amber-400',   glow: 'from-amber-500/10'   },
  { icon: Target,        label: 'Conversões',         value: '0',       border: 'border-orange-500/20',  bg: 'bg-orange-500/10',  color: 'text-orange-400',  glow: 'from-orange-500/10'  },
  { icon: Percent,       label: 'ACOS',               value: '—',       border: 'border-primary/20',     bg: 'bg-primary/10',     color: 'text-primary',     glow: 'from-primary/10'     },
  { icon: ShoppingBag,   label: 'TACOS',              value: '—',       border: 'border-primary/20',     bg: 'bg-primary/10',     color: 'text-primary',     glow: 'from-primary/10'     },
]

export default function ClienteAnunciosPage() {
  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Meus Anúncios" subtitle="Performance de campanhas" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className={cn('relative flex items-center gap-3 rounded-xl border bg-white/[0.03] overflow-hidden p-3.5', kpi.border)}>
              <div className={cn('absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent pointer-events-none opacity-50', kpi.glow)} />
              <div className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', kpi.bg)}>
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-0.5">{kpi.label}</p>
                <p className="text-xl font-black text-white/30">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white">Investimento Diário</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BarChart2 className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/25">Sem dados para exibir</p>
          </div>
        </div>

        {/* Campaigns empty */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white">Campanhas Ativas</h3>
            <span className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-[10px] text-white/30">0</span>
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Megaphone className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/25">Nenhuma campanha ativa</p>
            <p className="text-xs text-white/15">As campanhas aparecerão após a integração ser ativada</p>
          </div>
        </div>

      </div>
    </div>
  )
}
