'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Target, Users, Loader2, Pickaxe, FileText, TrendingUp,
  MessageCircle, AlertTriangle, ExternalLink, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CentralData {
  goal: { target: number; mrr: number; gap: number; progressPct: number }
  clients: {
    total: number
    paying: number
    inTrial: number
    list: { id: string; name: string; plan: string | null; monthlyValue: number; inTrial: boolean; salesCount: number }[]
  }
  reports: { weekStart: string; generated: number; sent: number; totalClients: number }
  miner: {
    online: boolean
    inQueue?: number
    contactedToday?: number
    contactedTotal?: number
    totalLeads?: number
    byStatus?: Record<string, number>
    lastRun?: { finishedAt: string; leadsSaved: number; regions: string[] } | null
    nichePerformance?: Record<string, { total: number; converted: number; rate: number }>
  }
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const NICHE_LABELS: Record<string, string> = {
  clinica_estetica: 'Clínica de Estética',
  saude_bem_estar: 'Saúde e Bem-Estar',
  salao_barbearia: 'Salão / Barbearia',
  nutricionista: 'Nutricionista',
  fisioterapia: 'Fisioterapia',
  psicologia: 'Psicologia',
  personal_trainer: 'Personal Trainer',
  odontologia: 'Odontologia',
  dermatologia: 'Dermatologia',
  spa_massagem: 'Spa / Massagem',
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Icon className={cn('h-4 w-4', accent)} />
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}

export default function CentralPage() {
  const [data, setData] = useState<CentralData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/central')
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando central...
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-muted-foreground">Sem acesso ou erro ao carregar.</div>
  }

  const { goal, clients, reports, miner } = data
  const nichePerf = Object.entries(miner.nichePerformance ?? {})
    .filter(([, v]) => v.total >= 3)
    .sort((a, b) => b[1].rate - a[1].rate)

  return (
    <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-emerald-500" />
            Central 20k
          </h1>
          <p className="text-sm text-muted-foreground">
            Aquisição automática + entrega recorrente, em um só painel.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); load() }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      {/* Meta */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
          <div>
            <div className="text-sm text-muted-foreground">Receita recorrente mensal (MRR)</div>
            <div className="text-3xl font-bold">{fmtBRL(goal.mrr)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Meta</div>
            <div className="text-xl font-semibold">{fmtBRL(goal.target)}</div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${goal.progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{goal.progressPct.toFixed(1)}% da meta</span>
          <span>faltam {fmtBRL(goal.gap)}/mês</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Clientes pagantes"
          value={clients.paying}
          sub={`${clients.inTrial} em trial · ${clients.total} total`}
          accent="text-blue-500"
        />
        <StatCard
          icon={Pickaxe}
          label="Leads na fila"
          value={miner.online ? (miner.inQueue ?? 0) : '—'}
          sub={miner.online ? `${miner.totalLeads} na base` : 'minerador offline'}
          accent="text-amber-500"
        />
        <StatCard
          icon={MessageCircle}
          label="Contatados hoje"
          value={miner.online ? (miner.contactedToday ?? 0) : '—'}
          sub={miner.online ? `${miner.contactedTotal} no total` : undefined}
          accent="text-violet-500"
        />
        <StatCard
          icon={FileText}
          label="Relatórios da semana"
          value={`${reports.generated}/${reports.totalClients}`}
          sub={`${reports.sent} enviados`}
          accent="text-emerald-500"
        />
      </div>

      {!miner.online && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          O Opportunity Miner não está respondendo em localhost:3050 — suba com{' '}
          <code className="px-1 rounded bg-muted">npm run dev</code> em ~/opportunity-miner.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Clientes / receita */}
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Receita por cliente
          </div>
          {clients.list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {clients.list.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1">
                  <span className="truncate flex items-center gap-2">
                    {c.name}
                    {c.inTrial && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600">trial</span>
                    )}
                  </span>
                  <span className={cn('shrink-0', c.monthlyValue > 0 ? 'font-medium' : 'text-muted-foreground')}>
                    {c.monthlyValue > 0 ? `${fmtBRL(c.monthlyValue)}/mês` : 'sem plano'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aprendizado do minerador */}
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <Pickaxe className="h-4 w-4 text-amber-500" /> Conversão por nicho (auto-aprendizado)
          </div>
          {!miner.online || nichePerf.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda sem histórico suficiente. Conforme você marca leads como qualificados ou
              contatados, o minerador prioriza os nichos que mais convertem.
            </p>
          ) : (
            <div className="space-y-2">
              {nichePerf.map(([niche, v]) => (
                <div key={niche}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span>{NICHE_LABELS[niche] ?? niche}</span>
                    <span className="text-muted-foreground">
                      {(v.rate * 100).toFixed(0)}% · {v.converted}/{v.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, v.rate * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {miner.lastRun && (
            <p className="text-xs text-muted-foreground mt-3">
              Última mineração: {new Date(miner.lastRun.finishedAt).toLocaleString('pt-BR')} ·{' '}
              {miner.lastRun.leadsSaved} leads
            </p>
          )}
        </div>
      </div>

      {/* Atalhos */}
      <div className="flex gap-2 flex-wrap">
        <a href="http://localhost:3050/fila" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" /> Fila de Outreach
          </Button>
        </a>
        <Link href="/relatorios">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" /> Relatórios Semanais
          </Button>
        </Link>
        <Link href="/admin/clientes">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" /> Gerenciar Clientes
          </Button>
        </Link>
      </div>
    </div>
  )
}
