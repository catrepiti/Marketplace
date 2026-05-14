'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  TrendingUp, ShoppingCart, Package, Star,
  BarChart2, Plug, CheckCircle2,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { cn, formatCurrency } from '@/lib/utils'

interface AccountInfo { marketplace: string; accountName: string; status: string }

const MP_LABEL: Record<string, string> = {
  MERCADOLIVRE: 'Mercado Livre',
  SHOPEE: 'Shopee',
  AMAZON: 'Amazon',
  MAGALU: 'Magalu',
  AMERICANAS: 'Americanas',
  CASASBABIA: 'Casas Bahia',
}
const MP_DOT: Record<string, string> = {
  MERCADOLIVRE: 'bg-yellow-400',
  SHOPEE: 'bg-orange-400',
  AMAZON: 'bg-amber-400',
  MAGALU: 'bg-blue-400',
  AMERICANAS: 'bg-red-400',
  CASASBABIA: 'bg-indigo-400',
}

export default function ClienteDashboard() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [clientName, setClientName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cliente/me')
      .then(r => r.json())
      .then(d => { setAccounts(d.accounts ?? []); setClientName(d.clientName ?? null) })
      .finally(() => setLoading(false))
  }, [])

  const hasAccounts = accounts.length > 0
  const firstName = user?.name?.split(' ')[0] ?? 'Cliente'

  const kpis = [
    { icon: TrendingUp,  label: 'Receita (30d)',   value: formatCurrency(0), color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'from-emerald-500/10' },
    { icon: ShoppingCart,label: 'Pedidos',         value: '0',               color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    glow: 'from-blue-500/10'    },
    { icon: Package,     label: 'Ticket Médio',    value: formatCurrency(0), color: 'text-violet-400', bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  glow: 'from-violet-500/10'  },
    { icon: Star,        label: 'Avaliação Média', value: '—',               color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   glow: 'from-amber-500/10'   },
  ]

  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header
        title={`Olá, ${firstName} 👋`}
        subtitle={clientName ? `Painel — ${clientName}` : 'Seu painel de performance'}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Connection status banner */}
        <div className={cn(
          'rounded-xl border p-4 flex items-start gap-3',
          hasAccounts
            ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
            : 'border-amber-500/20 bg-amber-500/[0.05]'
        )}>
          {hasAccounts
            ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            : <Plug className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          }
          <div>
            <p className={cn('text-sm font-semibold', hasAccounts ? 'text-emerald-400' : 'text-amber-400')}>
              {hasAccounts ? 'Integrações ativas' : 'Aguardando integração'}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {hasAccounts
                ? `${accounts.length} marketplace${accounts.length > 1 ? 's' : ''} conectado${accounts.length > 1 ? 's' : ''}. Os dados serão atualizados em breve.`
                : 'Nenhuma conta de marketplace conectada ainda. Entre em contato com seu gestor para ativar as integrações.'}
            </p>
            {hasAccounts && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {accounts.map(a => (
                  <span key={a.marketplace} className="flex items-center gap-1.5 text-[11px] text-white/50 bg-white/[0.05] border border-white/[0.08] rounded-full px-2.5 py-0.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', MP_DOT[a.marketplace] ?? 'bg-white/40')} />
                    {MP_LABEL[a.marketplace] ?? a.marketplace}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className={cn('relative flex items-center gap-3 rounded-xl border bg-white/[0.03] overflow-hidden p-3.5', kpi.border)}>
              <div className={cn('absolute inset-y-0 left-0 w-24 bg-gradient-to-r to-transparent pointer-events-none opacity-50', kpi.glow)} />
              <div className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', kpi.bg)}>
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-0.5">{kpi.label}</p>
                <p className="text-xl font-black text-white/30 leading-tight">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white">Evolução de Receita</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BarChart2 className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/25">Sem dados para exibir</p>
            <p className="text-xs text-white/15">Os gráficos aparecerão após a primeira sincronização</p>
          </div>
        </div>

        {/* Marketplace breakdown placeholder */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(hasAccounts ? accounts : []).map(a => (
            <div key={a.marketplace} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', MP_DOT[a.marketplace] ?? 'bg-white/40')} />
                <p className="text-sm font-semibold text-white">{MP_LABEL[a.marketplace] ?? a.marketplace}</p>
                <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">Ativo</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Receita', formatCurrency(0)], ['Pedidos', '0'], ['Avaliação', '—']].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-base font-bold text-white/30">{value}</p>
                    <p className="text-[10px] text-white/25">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!hasAccounts && (
            <div className="col-span-full rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] flex flex-col items-center justify-center py-12 gap-2">
              <Plug className="h-8 w-8 text-white/10" />
              <p className="text-sm text-white/20">Nenhuma integração ativa</p>
            </div>
          )}
        </div>

        {/* Recent orders placeholder */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Pedidos Recentes</h3>
            <a href="/cliente/pedidos" className="text-xs text-primary hover:opacity-80 transition-opacity">Ver todos →</a>
          </div>
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <ShoppingCart className="h-8 w-8 text-white/10" />
            <p className="text-sm text-white/25">Nenhum pedido ainda</p>
          </div>
        </div>

      </div>
    </div>
  )
}
