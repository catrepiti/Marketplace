'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { MARKETPLACE_LIST, MarketplaceKey } from '@/lib/marketplaces'

interface SalesChartProps {
  data: ({ date: string; total: number } & Record<string, number | string>)[]
  period: number
  filter?: string // 'all' | MarketplaceKey
}

function formatXAxis(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-2">
        {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date(label + 'T00:00:00'))}
      </p>
      {payload.map((p: any) => {
        const mp = MARKETPLACE_LIST.find(m => m.key === p.dataKey)
        return (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{mp?.label ?? p.dataKey}:</span>
            <span className="font-medium text-foreground">{formatCurrency(p.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function SalesChart({ data, period, filter = 'all' }: SalesChartProps) {
  const ticks = period <= 7 ? data.map(d => d.date)
    : period <= 30 ? data.filter((_, i) => i % 4 === 0).map(d => d.date)
    : data.filter((_, i) => i % 10 === 0).map(d => d.date)

  const visibleMPs = filter === 'all'
    ? MARKETPLACE_LIST.filter(mp => data.some(d => (d[mp.key] as number) > 0))
    : MARKETPLACE_LIST.filter(mp => mp.key === filter)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <defs>
          {visibleMPs.map(mp => (
            <linearGradient key={mp.key} id={`grad-${mp.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={mp.chartColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={mp.chartColor} stopOpacity={0}    />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date" ticks={ticks} tickFormatter={formatXAxis}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={v => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false} tickLine={false} width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        {filter === 'all' && (
          <Legend
            formatter={(value) => MARKETPLACE_LIST.find(m => m.key === value)?.label ?? value}
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          />
        )}
        {visibleMPs.map(mp => (
          <Area
            key={mp.key}
            type="monotone"
            dataKey={mp.key}
            name={mp.key}
            stroke={mp.chartColor}
            strokeWidth={2}
            fill={`url(#grad-${mp.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
