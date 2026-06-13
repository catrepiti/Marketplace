'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, Plus, Trash2, Check, X, FileSpreadsheet, ShoppingBag, AlertCircle } from 'lucide-react'

interface Client { id: string; name: string }
interface Sale {
  id: string
  clientId: string
  marketplace: string
  product: string
  customer: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
  saleDate: string
  client?: { name: string }
}

const MARKETPLACES = [
  { value: 'MERCADOLIVRE', label: 'Mercado Livre' },
  { value: 'SHOPEE', label: 'Shopee' },
  { value: 'AMAZON', label: 'Amazon' },
]

const emptyRow = { clientId: '', marketplace: 'MERCADOLIVRE', product: '', customer: '', quantity: 1, unitPrice: 0, saleDate: new Date().toISOString().split('T')[0] }

export default function VendasImportPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'manual' | 'csv' | 'history'>('manual')
  const [rows, setRows] = useState([{ ...emptyRow }])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvError, setCsvError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadClients = useCallback(async () => {
    const res = await fetch('/api/admin/clients')
    if (res.ok) {
      const data = await res.json()
      setClients(Array.isArray(data) ? data : data.clients ?? [])
    }
  }, [])

  const loadSales = useCallback(async () => {
    const res = await fetch('/api/admin/sales?limit=50')
    if (res.ok) {
      const data = await res.json()
      setSales(data.sales ?? [])
      setTotalSales(data.total ?? 0)
    }
  }, [])

  useEffect(() => {
    Promise.all([loadClients(), loadSales()]).finally(() => setLoading(false))
  }, [loadClients, loadSales])

  function updateRow(idx: number, field: string, value: any) {
    setRows(rows.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function addRow() {
    const lastRow = rows[rows.length - 1]
    setRows([...rows, { ...emptyRow, clientId: lastRow?.clientId ?? '', marketplace: lastRow?.marketplace ?? 'MERCADOLIVRE' }])
  }

  function removeRow(idx: number) {
    if (rows.length === 1) return
    setRows(rows.filter((_, i) => i !== idx))
  }

  async function submitManual() {
    setImporting(true)
    setResult(null)

    const payload = rows
      .filter(r => r.clientId && r.product && r.unitPrice > 0)
      .map(r => ({
        clientId: r.clientId,
        marketplace: r.marketplace,
        product: r.product,
        customer: r.customer || null,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice),
        totalPrice: Number(r.quantity) * Number(r.unitPrice),
        saleDate: r.saleDate,
      }))

    if (payload.length === 0) {
      setResult({ ok: false, message: 'Preencha pelo menos uma linha com cliente, produto e preço' })
      setImporting(false)
      return
    }

    const res = await fetch('/api/admin/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      setResult({ ok: true, message: `${data.imported} venda(s) importada(s) com sucesso!` })
      setRows([{ ...emptyRow }])
      loadSales()
    } else {
      const err = await res.json()
      setResult({ ok: false, message: err.error ?? 'Erro ao importar' })
    }
    setImporting(false)
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError('')
    setCsvData([])

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) { setCsvError('CSV vazio ou sem dados'); return }

      const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
      const requiredHeaders = ['produto', 'preco']
      const missing = requiredHeaders.filter(h => !headers.some(hh => hh.includes(h)))
      if (missing.length > 0) {
        setCsvError(`Colunas obrigatórias não encontradas: ${missing.join(', ')}. Use: cliente,marketplace,produto,preco,quantidade,data`)
        return
      }

      const parsed = lines.slice(1).map((line, lineIdx) => {
        const cols = line.split(/[,;]/).map(c => c.trim().replace(/^["']|["']$/g, ''))
        const row: any = {}
        headers.forEach((h, i) => { row[h] = cols[i] ?? '' })
        return {
          _line: lineIdx + 2,
          clientName: row.cliente ?? row.client ?? '',
          marketplace: (row.marketplace ?? row.plataforma ?? 'MERCADOLIVRE').toUpperCase(),
          product: row.produto ?? row.product ?? '',
          customer: row.comprador ?? row.customer ?? '',
          quantity: parseInt(row.quantidade ?? row.quantity ?? '1') || 1,
          unitPrice: parseFloat((row.preco ?? row.price ?? '0').replace(',', '.')) || 0,
          saleDate: row.data ?? row.date ?? new Date().toISOString().split('T')[0],
        }
      }).filter(r => r.product && r.unitPrice > 0)

      if (parsed.length === 0) { setCsvError('Nenhuma linha válida encontrada'); return }
      setCsvData(parsed)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submitCSV() {
    if (csvData.length === 0) return
    setImporting(true)
    setResult(null)

    const clientMap: Record<string, string> = {}
    clients.forEach(c => { clientMap[c.name.toLowerCase()] = c.id })

    const payload = csvData.map(r => {
      const clientId = clientMap[r.clientName.toLowerCase()] ?? clients[0]?.id ?? ''
      return {
        clientId,
        marketplace: r.marketplace,
        product: r.product,
        customer: r.customer || null,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        totalPrice: r.quantity * r.unitPrice,
        saleDate: r.saleDate,
      }
    }).filter(r => r.clientId)

    if (payload.length === 0) {
      setResult({ ok: false, message: 'Nenhum cliente correspondente encontrado. Verifique os nomes.' })
      setImporting(false)
      return
    }

    const res = await fetch('/api/admin/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = await res.json()
      setResult({ ok: true, message: `${data.imported} venda(s) importada(s) via CSV!` })
      setCsvData([])
      loadSales()
    } else {
      const err = await res.json()
      setResult({ ok: false, message: err.error ?? 'Erro ao importar CSV' })
    }
    setImporting(false)
  }

  async function deleteSale(id: string) {
    if (!confirm('Excluir esta venda?')) return
    await fetch('/api/admin/sales', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadSales()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar Vendas</h1>
        <p className="text-muted-foreground text-sm mt-1">Adicione vendas manualmente ou importe via CSV</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {[
          { key: 'manual' as const, label: 'Manual', icon: Plus },
          { key: 'csv' as const, label: 'Importar CSV', icon: FileSpreadsheet },
          { key: 'history' as const, label: `Histórico (${totalSales})`, icon: ShoppingBag },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResult(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {result.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {result.message}
        </div>
      )}

      {/* Manual entry */}
      {tab === 'manual' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 pr-2">Cliente</th>
                  <th className="text-left pb-2 pr-2">Marketplace</th>
                  <th className="text-left pb-2 pr-2">Produto</th>
                  <th className="text-left pb-2 pr-2">Comprador</th>
                  <th className="text-left pb-2 pr-2 w-20">Qtd</th>
                  <th className="text-left pb-2 pr-2 w-28">Preço unit.</th>
                  <th className="text-left pb-2 pr-2 w-32">Data</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-2">
                      <select
                        value={r.clientId}
                        onChange={e => updateRow(i, 'clientId', e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Selecione...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={r.marketplace}
                        onChange={e => updateRow(i, 'marketplace', e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        {MARKETPLACES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={r.product}
                        onChange={e => updateRow(i, 'product', e.target.value)}
                        placeholder="Nome do produto"
                        className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={r.customer}
                        onChange={e => updateRow(i, 'customer', e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={1}
                        value={r.quantity}
                        onChange={e => updateRow(i, 'quantity', Number(e.target.value))}
                        className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        value={r.unitPrice}
                        onChange={e => updateRow(i, 'unitPrice', Number(e.target.value))}
                        className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="date"
                        value={r.saleDate}
                        onChange={e => updateRow(i, 'saleDate', e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeRow(i)} disabled={rows.length === 1} className="text-muted-foreground hover:text-red-400 disabled:opacity-20">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={addRow} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" /> Adicionar linha
            </button>
            <button
              onClick={submitManual}
              disabled={importing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> {importing ? 'Importando...' : 'Importar Vendas'}
            </button>
          </div>
        </div>
      )}

      {/* CSV import */}
      {tab === 'csv' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Arraste um arquivo CSV ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mb-4">
              Colunas: <code className="bg-white/5 px-1 rounded">cliente, marketplace, produto, preco, quantidade, comprador, data</code>
            </p>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSV} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium">
              Selecionar arquivo
            </button>
          </div>

          {csvError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl">
              <AlertCircle className="h-4 w-4" /> {csvError}
            </div>
          )}

          {csvData.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground">{csvData.length} linha(s) encontrada(s)</div>
              <div className="max-h-60 overflow-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Linha</th>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-left p-2">MP</th>
                      <th className="text-left p-2">Produto</th>
                      <th className="text-left p-2">Qtd</th>
                      <th className="text-left p-2">Preço</th>
                      <th className="text-left p-2">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="p-2 text-muted-foreground">{r._line}</td>
                        <td className="p-2">{r.clientName || '—'}</td>
                        <td className="p-2">{r.marketplace}</td>
                        <td className="p-2">{r.product}</td>
                        <td className="p-2">{r.quantity}</td>
                        <td className="p-2">R$ {r.unitPrice.toFixed(2)}</td>
                        <td className="p-2">{r.saleDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 20 && <p className="text-xs text-muted-foreground">...e mais {csvData.length - 20} linhas</p>}
              <button
                onClick={submitCSV}
                disabled={importing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                <Upload className="h-4 w-4" /> {importing ? 'Importando...' : `Importar ${csvData.length} venda(s)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Sales history */}
      {tab === 'history' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {sales.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma venda importada</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Marketplace</th>
                  <th className="text-left p-3">Produto</th>
                  <th className="text-right p-3">Qtd</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-center p-3">Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-t border-border/50 hover:bg-white/[0.02]">
                    <td className="p-3">{new Date(s.saleDate).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">{s.client?.name ?? '—'}</td>
                    <td className="p-3">
                      <span className="bg-white/5 px-2 py-0.5 rounded text-xs">{s.marketplace}</span>
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{s.product}</td>
                    <td className="p-3 text-right">{s.quantity}</td>
                    <td className="p-3 text-right font-medium">R$ {s.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                        s.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {s.status === 'paid' ? 'Pago' : s.status === 'cancelled' ? 'Cancelado' : s.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => deleteSale(s.id)} className="text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
