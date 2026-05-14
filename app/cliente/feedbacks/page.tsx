'use client'
import { MessageSquare, Star } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/utils'

export default function ClienteFeedbacksPage() {
  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Minhas Avaliações" subtitle="Feedbacks dos seus clientes" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total de Avaliações', value: '0'  },
            { label: 'Nota Média',          value: '—'  },
            { label: 'Sem Resposta',        value: '0'  },
            { label: 'Respondidas',         value: '0'  },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">{k.label}</p>
              <p className="text-xl font-black text-white/30">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Rating distribution */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <Star className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white">Distribuição de Notas</h3>
          </div>
          <div className="p-5 space-y-2.5">
            {[5,4,3,2,1].map(star => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-white/40 w-3 text-right">{star}</span>
                <Star className="h-3 w-3 text-amber-400/40 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-white/[0.05]" />
                <span className="text-xs text-white/25 w-6 text-right">0</span>
              </div>
            ))}
          </div>
        </div>

        {/* Empty list */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h3 className="text-sm font-semibold text-white">Avaliações Recentes</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageSquare className="h-10 w-10 text-white/10" />
            <p className="text-sm text-white/25">Nenhuma avaliação ainda</p>
            <p className="text-xs text-white/15">As avaliações aparecerão após a integração ser ativada</p>
          </div>
        </div>

      </div>
    </div>
  )
}
