'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileSpreadsheet, FileDown, Plus, Trash2, Loader2, Calendar,
  TrendingUp, TrendingDown, DollarSign, BarChart3, ChevronDown, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sidebar } from '@/components/layout/Sidebar'

interface DreData {
  clientName: string
  period: { from: string; to: string }
  summary: {
    totalSales: number
    totalQuantity: number
    receitaBruta: number
    deducoes: number
    receitaLiquida: number
    cpv: number
    frete: number
    lucroBruto: number
    despesasOperacionais: number
    despesasFinanceiras: number
    resultadoOperacional: number
    resultadoLiquido: number
    margemBruta: number
    margemLiquida: number
  }
  expensesByCategory: Record<string, { label: string; total: number; items: any[] }>
  salesByMarketplace: Record<string, number>
  salesByMonth: Record<string, number>
  categories: Record<string, string>
}

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
}

const CATEGORIES = [
  { value: 'COMISSAO', label: 'Comissões de Marketplace' },
  { value: 'CPV', label: 'Custo dos Produtos Vendidos' },
  { value: 'FRETE', label: 'Frete e Logística' },
  { value: 'IMPOSTO', label: 'Impostos' },
  { value: 'ADMINISTRATIVO', label: 'Despesas Administrativas' },
  { value: 'MARKETING', label: 'Marketing e Publicidade' },
  { value: 'FINANCEIRO', label: 'Despesas Financeiras' },
  { value: 'OUTRO', label: 'Outras Despesas' },
]

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function getDefaultPeriod() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function DreRow({ label, value, bold, indent, negative, highlight, border }: {
  label: string; value: number; bold?: boolean; indent?: boolean; negative?: boolean; highlight?: boolean; border?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center justify-between py-2.5 px-4',
      border && 'border-t border-white/[0.06]',
      highlight && 'bg-white/[0.03] rounded-lg',
    )}>
      <span className={cn(
        'text-sm',
        bold ? 'font-semibold text-white' : 'text-white/50',
        indent && 'pl-5',
      )}>
        {negative && '(-) '}{label}
      </span>
      <span className={cn(
        'text-sm font-mono tabular-nums',
        bold ? 'font-bold text-white' : 'text-white/60',
        value < 0 && 'text-red-400',
        highlight && value >= 0 && 'text-emerald-400',
      )}>
        {fmt(value)}
      </span>
    </div>
  )
}

export default function DrePage() {
  const [period, setPeriod] = useState(getDefaultPeriod)
  const [dre, setDre] = useState<DreData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newExpense, setNewExpense] = useState({ category: 'COMISSAO', description: '', amount: '', date: '' })
  const [savingExpense, setSavingExpense] = useState(false)
  const [activeTab, setActiveTab] = useState<'dre' | 'despesas'>('dre')
  const reportRef = useRef<HTMLDivElement>(null)

  const fetchDre = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dre?from=${period.from}&to=${period.to}`)
      if (res.ok) setDre(await res.json())
    } catch {}
    setLoading(false)
  }, [period])

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(`/api/expenses?from=${period.from}&to=${period.to}`)
      if (res.ok) setExpenses(await res.json())
    } catch {}
  }, [period])

  useEffect(() => { fetchDre(); fetchExpenses() }, [fetchDre, fetchExpenses])

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return
    setSavingExpense(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          date: newExpense.date || new Date().toISOString().slice(0, 10),
        }),
      })
      if (res.ok) {
        setNewExpense({ category: 'COMISSAO', description: '', amount: '', date: '' })
        setShowExpenseModal(false)
        fetchDre()
        fetchExpenses()
      }
    } catch {}
    setSavingExpense(false)
  }

  const handleDeleteExpense = async (id: string) => {
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
    fetchDre()
    fetchExpenses()
  }

  const exportExcel = async () => {
    if (!dre) return
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const dreRows = [
      ['DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO'],
      [`Empresa: ${dre.clientName}`],
      [`Período: ${new Date(dre.period.from).toLocaleDateString('pt-BR')} a ${new Date(dre.period.to).toLocaleDateString('pt-BR')}`],
      [],
      ['Descrição', 'Valor (R$)'],
      ['RECEITA BRUTA DE VENDAS', dre.summary.receitaBruta],
      [`  Vendas (${dre.summary.totalSales} pedidos)`, dre.summary.receitaBruta],
      [],
      ['(-) DEDUÇÕES DA RECEITA', -dre.summary.deducoes],
      ['  Comissões de marketplace', -(dre.expensesByCategory?.COMISSAO?.total ?? 0)],
      ['  Impostos sobre vendas', -(dre.expensesByCategory?.IMPOSTO?.total ?? 0)],
      [],
      ['= RECEITA LÍQUIDA', dre.summary.receitaLiquida],
      [],
      ['(-) CUSTO DOS PRODUTOS VENDIDOS', -dre.summary.cpv],
      ['(-) FRETE E LOGÍSTICA', -dre.summary.frete],
      [],
      ['= LUCRO BRUTO', dre.summary.lucroBruto],
      [`  Margem bruta: ${dre.summary.margemBruta}%`, ''],
      [],
      ['(-) DESPESAS OPERACIONAIS', -dre.summary.despesasOperacionais],
      ['  Despesas administrativas', -(dre.expensesByCategory?.ADMINISTRATIVO?.total ?? 0)],
      ['  Marketing e publicidade', -(dre.expensesByCategory?.MARKETING?.total ?? 0)],
      ['  Outras despesas', -(dre.expensesByCategory?.OUTRO?.total ?? 0)],
      [],
      ['= RESULTADO OPERACIONAL', dre.summary.resultadoOperacional],
      [],
      ['(-) DESPESAS FINANCEIRAS', -dre.summary.despesasFinanceiras],
      [],
      ['= RESULTADO LÍQUIDO DO EXERCÍCIO', dre.summary.resultadoLiquido],
      [`  Margem líquida: ${dre.summary.margemLiquida}%`, ''],
    ]

    const ws = XLSX.utils.aoa_to_sheet(dreRows)
    ws['!cols'] = [{ wch: 45 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws, 'DRE')

    if (expenses.length > 0) {
      const expRows = [
        ['Data', 'Categoria', 'Descrição', 'Valor (R$)'],
        ...expenses.map(e => [
          new Date(e.date).toLocaleDateString('pt-BR'),
          CATEGORIES.find(c => c.value === e.category)?.label ?? e.category,
          e.description,
          e.amount,
        ]),
      ]
      const ws2 = XLSX.utils.aoa_to_sheet(expRows)
      ws2['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 40 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Despesas')
    }

    if (Object.keys(dre.salesByMarketplace).length > 0) {
      const mpRows = [
        ['Marketplace', 'Receita (R$)'],
        ...Object.entries(dre.salesByMarketplace).map(([mp, val]) => [mp, val]),
      ]
      const ws3 = XLSX.utils.aoa_to_sheet(mpRows)
      ws3['!cols'] = [{ wch: 20 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, ws3, 'Por Marketplace')
    }

    XLSX.writeFile(wb, `DRE_${dre.clientName}_${dre.period.from}_${dre.period.to}.xlsx`)
  }

  const exportPdf = async () => {
    if (!dre) return
    const { default: jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Empresa: ${dre.clientName}`, 14, 32)
    doc.text(`Período: ${new Date(dre.period.from).toLocaleDateString('pt-BR')} a ${new Date(dre.period.to).toLocaleDateString('pt-BR')}`, 14, 38)

    const tableData = [
      [{ content: 'RECEITA BRUTA DE VENDAS', styles: { fontStyle: 'bold' as const } }, fmt(dre.summary.receitaBruta)],
      [`   Vendas (${dre.summary.totalSales} pedidos, ${dre.summary.totalQuantity} unid.)`, fmt(dre.summary.receitaBruta)],
      ['', ''],
      [{ content: '(-) DEDUÇÕES DA RECEITA', styles: { fontStyle: 'bold' as const } }, fmt(-dre.summary.deducoes)],
      ['   Comissões de marketplace', fmt(-(dre.expensesByCategory?.COMISSAO?.total ?? 0))],
      ['   Impostos sobre vendas', fmt(-(dre.expensesByCategory?.IMPOSTO?.total ?? 0))],
      ['', ''],
      [{ content: '= RECEITA LÍQUIDA', styles: { fontStyle: 'bold' as const } }, fmt(dre.summary.receitaLiquida)],
      ['', ''],
      [{ content: '(-) CUSTO DOS PRODUTOS VENDIDOS', styles: { fontStyle: 'bold' as const } }, fmt(-dre.summary.cpv)],
      [{ content: '(-) FRETE E LOGÍSTICA', styles: { fontStyle: 'bold' as const } }, fmt(-dre.summary.frete)],
      ['', ''],
      [{ content: '= LUCRO BRUTO', styles: { fontStyle: 'bold' as const, fillColor: [240, 253, 244] as [number, number, number] } },
       { content: `${fmt(dre.summary.lucroBruto)}  (${dre.summary.margemBruta}%)`, styles: { fillColor: [240, 253, 244] as [number, number, number] } }],
      ['', ''],
      [{ content: '(-) DESPESAS OPERACIONAIS', styles: { fontStyle: 'bold' as const } }, fmt(-dre.summary.despesasOperacionais)],
      ['   Despesas administrativas', fmt(-(dre.expensesByCategory?.ADMINISTRATIVO?.total ?? 0))],
      ['   Marketing e publicidade', fmt(-(dre.expensesByCategory?.MARKETING?.total ?? 0))],
      ['   Outras despesas', fmt(-(dre.expensesByCategory?.OUTRO?.total ?? 0))],
      ['', ''],
      [{ content: '= RESULTADO OPERACIONAL', styles: { fontStyle: 'bold' as const } }, fmt(dre.summary.resultadoOperacional)],
      ['', ''],
      [{ content: '(-) DESPESAS FINANCEIRAS', styles: { fontStyle: 'bold' as const } }, fmt(-dre.summary.despesasFinanceiras)],
      ['', ''],
      [{ content: '= RESULTADO LÍQUIDO DO EXERCÍCIO', styles: { fontStyle: 'bold' as const, fillColor: dre.summary.resultadoLiquido >= 0 ? [240, 253, 244] as [number, number, number] : [254, 242, 242] as [number, number, number] } },
       { content: `${fmt(dre.summary.resultadoLiquido)}  (${dre.summary.margemLiquida}%)`, styles: { fillColor: dre.summary.resultadoLiquido >= 0 ? [240, 253, 244] as [number, number, number] : [254, 242, 242] as [number, number, number] } }],
    ]

    autoTable(doc, {
      startY: 44,
      head: [['Descrição', 'Valor (R$)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' } },
    })

    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Gerado por merly em ${new Date().toLocaleDateString('pt-BR')}`, 14, doc.internal.pageSize.getHeight() - 10)

    doc.save(`DRE_${dre.clientName}_${dre.period.from}_${dre.period.to}.pdf`)
  }

  const s = dre?.summary

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width,240px)] sidebar-transition">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                DRE — Demonstração do Resultado
              </h1>
              <p className="text-sm text-white/30 mt-1">Resultado financeiro da operação</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportExcel} disabled={!dre}
                className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">
                <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportPdf} disabled={!dre}
                className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">
                <FileDown className="h-4 w-4 mr-1.5" /> PDF
              </Button>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-white/30" />
              <input type="date" value={period.from}
                onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))}
                className="bg-transparent text-sm text-white border-none outline-none" />
              <span className="text-white/20">até</span>
              <input type="date" value={period.to}
                onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))}
                className="bg-transparent text-sm text-white border-none outline-none" />
            </div>
            <Button size="sm" onClick={() => { fetchDre(); fetchExpenses() }} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
            </Button>
            {[
              { label: 'Este mês', fn: () => { const n = new Date(); setPeriod({ from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10) }) } },
              { label: 'Mês anterior', fn: () => { const n = new Date(); setPeriod({ from: new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth(), 0).toISOString().slice(0, 10) }) } },
              { label: 'Este ano', fn: () => { const n = new Date(); setPeriod({ from: `${n.getFullYear()}-01-01`, to: n.toISOString().slice(0, 10) }) } },
            ].map(q => (
              <button key={q.label} onClick={q.fn}
                className="text-xs text-white/30 hover:text-primary px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                {q.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
            {(['dre', 'despesas'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-white/40 hover:text-white/60'
                )}>
                {tab === 'dre' ? 'Relatório DRE' : 'Despesas'}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && activeTab === 'dre' && dre && s && (
            <div ref={reportRef} className="space-y-6">

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Receita Bruta', value: s.receitaBruta, icon: DollarSign, color: 'text-blue-400' },
                  { label: 'Lucro Bruto', value: s.lucroBruto, icon: s.lucroBruto >= 0 ? TrendingUp : TrendingDown, color: s.lucroBruto >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Margem Bruta', value: s.margemBruta, icon: BarChart3, color: 'text-purple-400', suffix: '%' },
                  { label: 'Resultado Líquido', value: s.resultadoLiquido, icon: s.resultadoLiquido >= 0 ? TrendingUp : TrendingDown, color: s.resultadoLiquido >= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map((card, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className={cn('h-4 w-4', card.color)} />
                      <span className="text-xs text-white/30">{card.label}</span>
                    </div>
                    <p className={cn('text-xl font-bold', card.color)}>
                      {card.suffix ? `${card.value}${card.suffix}` : fmt(card.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* DRE Table */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">DRE — {dre.clientName}</h2>
                  <span className="text-xs text-white/20">
                    {new Date(dre.period.from).toLocaleDateString('pt-BR')} — {new Date(dre.period.to).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <DreRow label="RECEITA BRUTA DE VENDAS" value={s.receitaBruta} bold />
                <DreRow label={`Vendas (${s.totalSales} pedidos, ${s.totalQuantity} unid.)`} value={s.receitaBruta} indent />

                <DreRow label="DEDUÇÕES DA RECEITA" value={-s.deducoes} bold negative border />
                <DreRow label="Comissões de marketplace" value={-(dre.expensesByCategory?.COMISSAO?.total ?? 0)} indent />
                <DreRow label="Impostos sobre vendas" value={-(dre.expensesByCategory?.IMPOSTO?.total ?? 0)} indent />

                <DreRow label="RECEITA LÍQUIDA" value={s.receitaLiquida} bold highlight border />

                <DreRow label="CUSTO DOS PRODUTOS VENDIDOS (CPV)" value={-s.cpv} bold negative border />
                <DreRow label="FRETE E LOGÍSTICA" value={-s.frete} bold negative />

                <DreRow label="LUCRO BRUTO" value={s.lucroBruto} bold highlight border />

                <DreRow label="DESPESAS OPERACIONAIS" value={-s.despesasOperacionais} bold negative border />
                <DreRow label="Despesas administrativas" value={-(dre.expensesByCategory?.ADMINISTRATIVO?.total ?? 0)} indent />
                <DreRow label="Marketing e publicidade" value={-(dre.expensesByCategory?.MARKETING?.total ?? 0)} indent />
                <DreRow label="Outras despesas" value={-(dre.expensesByCategory?.OUTRO?.total ?? 0)} indent />

                <DreRow label="RESULTADO OPERACIONAL" value={s.resultadoOperacional} bold highlight border />

                <DreRow label="DESPESAS FINANCEIRAS" value={-s.despesasFinanceiras} bold negative border />

                <div className={cn(
                  'flex items-center justify-between py-3 px-4 border-t-2',
                  s.resultadoLiquido >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                )}>
                  <span className="text-sm font-bold text-white">RESULTADO LÍQUIDO DO EXERCÍCIO</span>
                  <div className="text-right">
                    <span className={cn('text-lg font-bold font-mono tabular-nums', s.resultadoLiquido >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {fmt(s.resultadoLiquido)}
                    </span>
                    <span className="text-xs text-white/30 ml-2">({s.margemLiquida}%)</span>
                  </div>
                </div>
              </div>

              {/* Revenue by marketplace */}
              {Object.keys(dre.salesByMarketplace).length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Receita por Marketplace</h3>
                  <div className="space-y-2">
                    {Object.entries(dre.salesByMarketplace)
                      .sort((a, b) => b[1] - a[1])
                      .map(([mp, val]) => {
                        const pct = s.receitaBruta > 0 ? (val / s.receitaBruta) * 100 : 0
                        return (
                          <div key={mp}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-white/50 capitalize">{mp}</span>
                              <span className="text-white/60 font-mono">{fmt(val)} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expenses tab */}
          {!loading && activeTab === 'despesas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Despesas do período</h2>
                <Button size="sm" onClick={() => setShowExpenseModal(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Adicionar despesa
                </Button>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <DollarSign className="h-10 w-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/30">Nenhuma despesa registrada no período</p>
                  <p className="text-xs text-white/15 mt-1">Adicione despesas para calcular a DRE completa</p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Data</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Categoria</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">Valor</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-sm text-white/50">{new Date(exp.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-medium bg-white/5 text-white/40 px-2 py-0.5 rounded-full">
                              {CATEGORIES.find(c => c.value === exp.category)?.label ?? exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60">{exp.description}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono text-red-400">{fmt(exp.amount)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/[0.08]">
                        <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-white">Total</td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-bold text-red-400">
                          {fmt(expenses.reduce((s, e) => s + e.amount, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && !dre && activeTab === 'dre' && (
            <div className="text-center py-20">
              <BarChart3 className="h-12 w-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Selecione um período e clique em Atualizar</p>
            </div>
          )}
        </div>
      </main>

      {/* Add expense modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1220] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Nova despesa</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-white/30 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-white/40 mb-1 block">Categoria</label>
                <select value={newExpense.category}
                  onChange={e => setNewExpense(f => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary">
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value} className="bg-[#0c1220]">{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 mb-1 block">Descrição</label>
                <Input value={newExpense.description}
                  onChange={e => setNewExpense(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Comissão Mercado Livre junho"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1 block">Valor (R$)</label>
                  <Input type="number" step="0.01" value={newExpense.amount}
                    onChange={e => setNewExpense(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0,00"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-1 block">Data</label>
                  <Input type="date" value={newExpense.date}
                    onChange={e => setNewExpense(f => ({ ...f, date: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.08] text-white" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1 border-white/10 text-white/50"
                onClick={() => setShowExpenseModal(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleAddExpense} disabled={savingExpense || !newExpense.description || !newExpense.amount}>
                {savingExpense ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
