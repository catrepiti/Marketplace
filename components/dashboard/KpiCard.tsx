import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorMap = {
  blue:   { glow: 'from-blue-500/15',   icon: 'text-blue-400',   iconBg: 'bg-blue-500/10',   bar: 'bg-blue-500'   },
  green:  { glow: 'from-emerald-500/15',icon: 'text-emerald-400',iconBg: 'bg-emerald-500/10', bar: 'bg-emerald-500'},
  yellow: { glow: 'from-yellow-500/15', icon: 'text-yellow-400', iconBg: 'bg-yellow-500/10',  bar: 'bg-yellow-500' },
  red:    { glow: 'from-red-500/15',    icon: 'text-red-400',    iconBg: 'bg-red-500/10',     bar: 'bg-red-500'    },
  purple: { glow: 'from-violet-500/15', icon: 'text-violet-400', iconBg: 'bg-violet-500/10',  bar: 'bg-violet-500' },
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: KpiCardProps) {
  const c = colorMap[color]
  const trendUp = trend && trend.value >= 0

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all duration-200">
      {/* Gradient top accent */}
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent', c.glow)} />
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full', c.bar)} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">{title}</p>
          <p className="text-2xl font-black text-white tracking-tight leading-none num">{value}</p>
          {subtitle && <p className="text-[11px] text-white/35 mt-1.5 leading-snug">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                trendUp
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              )}>
                {trendUp
                  ? <TrendingUp className="h-2.5 w-2.5" />
                  : <TrendingDown className="h-2.5 w-2.5" />
                }
                {trendUp ? '+' : ''}{trend.value}%
              </span>
              <span className="text-[10px] text-white/25">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', c.iconBg)}>
          <Icon className={cn('h-5 w-5', c.icon)} />
        </div>
      </div>
    </div>
  )
}
