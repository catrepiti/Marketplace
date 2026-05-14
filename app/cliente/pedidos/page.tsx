'use client'
import { ShoppingCart, Search } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/utils'

const periods = ['7 dias', '30 dias', '60 dias', '90 dias']
const statuses = ['Todos', 'Pago', 'Enviado', 'Entregue', 'Cancelado']

export default function ClientePedidosPage() {
  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Meus Pedidos" subtitle="Histórico completo de vendas" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total de Pedidos',  value: '0'       },
            { label: 'Receita Total',     value: 'R$ 0,00' },
            { label: 'Ticket Médio',      value: 'R$ 0,00' },
            { label: 'Cancelamentos',     value: '0'       },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">{k.label}</p>
              <p className="text-xl font-black text-white/30">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
            <input
              placeholder="Buscar pedido..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
              disabled
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-0.5">
            {periods.map((p, i) => (
              <button key={p} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all', i === 1 ? 'bg-gradient-to-r from-primary to-blue-400 text-white' : 'text-white/30')}>{p}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-0.5">
            {statuses.map((s, i) => (
              <button key={s} className={cn('rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all', i === 0 ? 'bg-gradient-to-r from-primary to-blue-400 text-white' : 'text-white/30')}>{s}</button>
            ))}
          </div>
        </div>

        {/* Empty table */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                {['Pedido', 'Marketplace', 'Produto', 'Valor', 'Status', 'Data'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
          </table>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingCart className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/25">Nenhum pedido encontrado</p>
            <p className="text-xs text-white/15">Os pedidos aparecerão após a integração ser ativada</p>
          </div>
        </div>

      </div>
    </div>
  )
}
