import { DashboardMetrics } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { getMP } from '@/lib/marketplaces'
import { cn } from '@/lib/utils'

interface TopProductsProps {
  products: DashboardMetrics['topProducts']
}

export function TopProducts({ products }: TopProductsProps) {
  const max = products[0]?.revenue ?? 1

  return (
    <div className="space-y-3">
      {products.map((p, i) => {
        const def = getMP(p.marketplace)
        const pct = (p.revenue / max) * 100
        return (
          <div key={p.sku} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground w-4 shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-medium text-foreground truncate pr-2">{p.product}</p>
                <span className="text-xs font-semibold text-foreground shrink-0">{formatCurrency(p.revenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', def.tailwind.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={cn('text-[10px] font-medium', def.tailwind.text)}>{p.quantity} un.</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
