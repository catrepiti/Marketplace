'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Loader2, Sparkles, TrendingUp, TrendingDown,
  Send, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Report {
  id: string
  clientId: string
  client: { name: string; slug: string }
  weekStart: string
  weekEnd: string
  totalRevenue: number
  totalOrders: number
  avgTicket: number
  totalExpenses: number
  netResult: number
  revenueDelta: number
  metricsJson: string
  aiSummary: string
  aiActions: string
  status: string
  sentAt: string | null
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

function ReportCard({ report, onSend, sending }: {
  report: Report
  onSend: (id: string) => void
  sending: boolean
}) {
  const [open, setOpen] = useState(false)
  const metrics = JSON.parse(report.metricsJson || '{}')
  const actions: string[] = JSON.parse(report.aiActions || '[]')
  const positive = report.revenueDelta >= 0

  return (
    <div className="rounded-xl border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <div className="font-medium">{report.client.name}</div>
            <div className="text-xs text-muted-foreground">
              Semana {fmtDate(report.weekStart)} – {fmtDate(report.weekEnd)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-semibold">{fmtBRL(report.totalRevenue)}</div>
            <div className={cn('text-xs flex items-center gap-1 justify-end', positive ? 'text-emerald-600' : 'text-red-500')}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {report.revenueDelta.toFixed(1)}% vs semana anterior
            </div>
          </div>
          {report.sentAt && (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">enviado</span>
          )}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Pedidos</div>
              <div className="text-lg font-semibold">{report.totalOrders}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Ticket médio</div>
              <div className="text-lg font-semibold">{fmtBRL(report.avgTicket)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Despesas</div>
              <div className="text-lg font-semibold">{fmtBRL(report.totalExpenses)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Resultado líquido</div>
              <div className={cn('text-lg font-semibold', report.netResult >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                {fmtBRL(report.netResult)}
              </div>
            </div>
          </div>

          {report.aiSummary && (
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Análise da semana
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{report.aiSummary}</p>
              {actions.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {actions.map((a, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-violet-500 font-semibold shrink-0">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(metrics.byMarketplace?.length > 0 || metrics.topProducts?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {metrics.byMarketplace?.length > 0 && (
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium mb-2">Por marketplace</div>
                  {metrics.byMarketplace.map((m: any) => (
                    <div key={m.marketplace} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">{m.marketplace}</span>
                      <span>{fmtBRL(m.revenue)} · {m.orders} pedidos</span>
                    </div>
                  ))}
                </div>
              )}
              {metrics.topProducts?.length > 0 && (
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium mb-2">Top produtos</div>
                  {metrics.topProducts.map((p: any) => (
                    <div key={p.name} className="flex justify-between text-sm py-1 gap-2">
                      <span className="text-muted-foreground truncate">{p.name}</span>
                      <span className="shrink-0">{fmtBRL(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={sending}
              onClick={() => onSend(report.id)}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar via WhatsApp
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RelatoriosPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      setReports(data.reports ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    setGenerating(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/reports', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const okCount = data.results?.filter((r: any) => r.ok).length ?? 0
        setFeedback(`Relatórios gerados para ${okCount} cliente(s).`)
        await load()
      } else {
        setFeedback(data.error ?? 'Erro ao gerar relatórios.')
      }
    } catch {
      setFeedback('Erro ao gerar relatórios.')
    }
    setGenerating(false)
  }

  const send = async (id: string) => {
    setSendingId(id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/reports/${id}/send`, { method: 'POST' })
      const data = await res.json()
      setFeedback(res.ok ? 'Relatório enviado via WhatsApp.' : (data.error ?? 'Erro ao enviar.'))
      if (res.ok) await load()
    } catch {
      setFeedback('Erro ao enviar relatório.')
    }
    setSendingId(null)
  }

  return (
    <div className="p-6 max-w-5xl w-full mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Semanais</h1>
          <p className="text-sm text-muted-foreground">
            Gerados automaticamente toda segunda-feira com análise de IA por cliente.
          </p>
        </div>
        <Button onClick={generate} disabled={generating}>
          {generating
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <RefreshCw className="h-4 w-4 mr-2" />}
          Gerar relatórios da semana
        </Button>
      </div>

      {feedback && (
        <div className="mb-4 text-sm rounded-lg border bg-muted/40 px-4 py-2">{feedback}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum relatório ainda</p>
          <p className="text-sm mt-1">
            Clique em &quot;Gerar relatórios da semana&quot; para criar o primeiro lote.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <ReportCard key={r.id} report={r} onSend={send} sending={sendingId === r.id} />
          ))}
        </div>
      )}
    </div>
  )
}
