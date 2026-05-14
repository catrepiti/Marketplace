'use client'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Order } from '@/lib/types'
import { formatCurrency, formatDate, statusConfig } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ClientePedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25', period, ...(status && { status }), ...(search && { search }) })
    fetch(`/api/vendas?${params}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setOrders(d.data); setTotal(d.total); setLoading(false) })
  }, [page, period, status, search])

  return (
    <div className="flex flex-col flex-1 bg-background">
      <Header title="Meus Pedidos" subtitle="Histórico completo" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar pedido..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={period} onChange={e => setPeriod(e.target.value)} options={[
              { value: '7', label: '7 dias' }, { value: '30', label: '30 dias' },
              { value: '60', label: '60 dias' }, { value: '90', label: '90 dias' },
            ]} className="w-32" />
            <Select value={status} onChange={e => setStatus(e.target.value)} placeholder="Todos status" options={[
              { value: 'paid', label: 'Pago' }, { value: 'processing', label: 'Processando' },
              { value: 'shipped', label: 'Enviado' }, { value: 'delivered', label: 'Entregue' },
              { value: 'cancelled', label: 'Cancelado' }, { value: 'returned', label: 'Devolvido' },
            ]} className="w-40" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Pedido', 'Marketplace', 'Produto', 'Qtd', 'Valor', 'Status', 'Data'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => {
                      const sc = statusConfig[order.status]
                      return (
                        <tr key={order.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 1 && 'bg-muted/10')}>
                          <td className="px-4 py-3">
                            <p className="text-xs font-mono font-medium">{order.id}</p>
                            <p className="text-[10px] text-muted-foreground">{order.externalId}</p>
                          </td>
                          <td className="px-4 py-3"><MarketplaceBadge marketplace={order.marketplace} size="xs" /></td>
                          <td className="px-4 py-3 text-xs max-w-[160px] truncate">{order.product}</td>
                          <td className="px-4 py-3 text-xs text-center">{order.quantity}</td>
                          <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(order.totalPrice)}</td>
                          <td className="px-4 py-3">
                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.bg, sc.color)}>{sc.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(order.createdAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} pedidos encontrados</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}>›</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
