'use client'
import { useEffect, useRef, useState } from 'react'
import { Zap } from 'lucide-react'
import { RealtimeSale } from '@/lib/types'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import { getMP } from '@/lib/marketplaces'
import { cn } from '@/lib/utils'

const MAX_ITEMS = 12

export function RealtimeFeed() {
  const [sales, setSales] = useState<RealtimeSale[]>([])
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/realtime', { cache: 'no-store' })
        const json = await res.json()
        if (json.sales?.length) {
          setSales(prev => {
            const merged = [...json.sales, ...prev].slice(0, MAX_ITEMS)
            return merged
          })
          setNewIds(new Set(json.sales.map((s: RealtimeSale) => s.id)))
          setTimeout(() => setNewIds(new Set()), 2000)
        }
      } catch {}
    }

    poll()
    intervalRef.current = setInterval(poll, 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground">Ao vivo — atualiza a cada 5s</span>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aguardando vendas...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {sales.map(sale => {
            const def = getMP(sale.marketplace)
            const isNew = newIds.has(sale.id)
            return (
              <div
                key={sale.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg p-2.5 transition-all duration-500',
                  isNew ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03]'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold',
                  'bg-white/[0.06] text-white/70'
                )}>
                  {def.abbr}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{sale.product}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sale.customer}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400">{formatCurrency(sale.value)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatTimeAgo(sale.timestamp)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
