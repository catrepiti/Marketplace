'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { TrendingUp, ShoppingCart, Star, MessageSquare, Package } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketplaceBadge } from '@/components/dashboard/MarketplaceBadge'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { DashboardMetrics } from '@/lib/types'
import { formatCurrency, formatDate, statusConfig } from '@/lib/utils'
import { cn } from '@/lib/utils'

function StarRow({ value }: { value: number }) {
  return (
    <span className="flex">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.round(value) ? 'text-yellow-400' : 'text-muted'}`}>★</span>
      ))}
    </span>
  )
}

export default function ClienteDashboard() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard?period=30', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setMetrics(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <Header title={`Olá, ${user?.name?.split(' ')[0] ?? 'Cliente'}`} subtitle="Seu painel de vendas" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="flex flex-col flex-1 bg-background">
      <Header
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'Cliente'}`}
        subtitle={user?.clientName ? `Painel — ${user.clientName}` : 'Seu painel de vendas'}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs simplificados */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Receita (30d)', value: formatCurrency(metrics.totalRevenue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pedidos', value: String(metrics.totalOrders), icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Ticket Médio', value: formatCurrency(metrics.averageTicket), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Avaliação Média', value: `${metrics.averageRating} ★`, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                  </div>
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', kpi.bg)}>
                    <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sales chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Evolução de Vendas — últimos 30 dias</CardTitle></CardHeader>
          <CardContent>
            <SalesChart data={metrics.salesByDay} period={30} />
          </CardContent>
        </Card>

        {/* Marketplace breakdown */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {metrics.byMarketplace.map(mp => {
            const isML = mp.marketplace === 'mercadolivre'
            return (
              <Card key={mp.marketplace}>
                <CardContent className={cn('p-4 rounded-xl', isML ? 'bg-yellow-50' : 'bg-orange-50')}>
                  <MarketplaceBadge marketplace={mp.marketplace} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(mp.revenue)}</p>
                      <p className="text-[10px] text-muted-foreground">Receita</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{mp.orders}</p>
                      <p className="text-[10px] text-muted-foreground">Pedidos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{mp.averageRating} ★</p>
                      <p className="text-[10px] text-muted-foreground">Avaliação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Pedidos Recentes</CardTitle>
              <a href="/cliente/pedidos" className="text-xs text-primary hover:underline">Ver todos →</a>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Pedido', 'Marketplace', 'Produto', 'Valor', 'Status', 'Data'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentOrders.slice(0, 6).map((order, i) => {
                    const sc = statusConfig[order.status]
                    return (
                      <tr key={order.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 1 && 'bg-muted/10')}>
                        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{order.id}</td>
                        <td className="px-4 py-2.5"><MarketplaceBadge marketplace={order.marketplace} size="xs" /></td>
                        <td className="px-4 py-2.5 text-xs text-foreground max-w-[180px] truncate">{order.product}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold">{formatCurrency(order.totalPrice)}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.bg, sc.color)}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(order.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
