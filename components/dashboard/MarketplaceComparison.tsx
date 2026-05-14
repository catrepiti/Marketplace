import { DashboardMetrics } from '@/lib/types'
import { formatCurrency, cn } from '@/lib/utils'
import { getMP } from '@/lib/marketplaces'
import { ShoppingCart, Star, TrendingUp } from 'lucide-react'

interface MarketplaceComparisonProps {
  data: DashboardMetrics['byMarketplace']
  totalRevenue: number
}

// Dark-mode accent map por marketplace (dot color → accent classes)
const DARK_ACCENT: Record<string, { glow: string; text: string; bar: string; badge: string }> = {
  mercadolivre: {
    glow:  'from-yellow-500/10 to-transparent',
    text:  'text-yellow-400',
    bar:   'bg-yellow-400',
    badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  },
  shopee: {
    glow:  'from-orange-500/10 to-transparent',
    text:  'text-orange-400',
    bar:   'bg-orange-400',
    badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  },
  amazon: {
    glow:  'from-amber-500/10 to-transparent',
    text:  'text-amber-400',
    bar:   'bg-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
}

const DEFAULT_ACCENT = {
  glow:  'from-primary/10 to-transparent',
  text:  'text-primary',
  bar:   'bg-primary',
  badge: 'bg-primary/10 border-primary/20 text-primary',
}

export function MarketplaceComparison({ data, totalRevenue }: MarketplaceComparisonProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {data.map(mp => {
        const def    = getMP(mp.marketplace)
        const pct    = totalRevenue > 0 ? ((mp.revenue / totalRevenue) * 100).toFixed(1) : '0'
        const accent = DARK_ACCENT[mp.marketplace] ?? DEFAULT_ACCENT

        return (
          <div
            key={mp.marketplace}
            className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200"
          >
            {/* Top gradient accent */}
            <div className={cn(
              'pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b',
              accent.glow
            )} />

            {/* Header: logo + name + % badge */}
            <div className="relative flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{def.connect.logo}</span>
                <span className={cn('text-xs font-bold', accent.text)}>
                  {def.label}
                </span>
              </div>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                accent.badge
              )}>
                {pct}%
              </span>
            </div>

            {/* Metrics */}
            <div className="relative space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className={cn('h-3.5 w-3.5 shrink-0', accent.text)} />
                <span className="text-[11px] text-white/40 flex-1">Receita</span>
                <span className="text-[11px] font-bold text-white">
                  {formatCurrency(mp.revenue)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className={cn('h-3.5 w-3.5 shrink-0', accent.text)} />
                <span className="text-[11px] text-white/40 flex-1">Pedidos</span>
                <span className="text-[11px] font-bold text-white">{mp.orders}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className={cn('h-3.5 w-3.5 shrink-0', accent.text)} />
                <span className="text-[11px] text-white/40 flex-1">Avaliação</span>
                <span className="text-[11px] font-bold text-white">
                  {mp.averageRating > 0 ? `${mp.averageRating.toFixed(1)} ★` : '—'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mt-3 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', accent.bar)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
