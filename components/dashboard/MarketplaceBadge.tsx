import { Marketplace } from '@/lib/types'
import { getMP } from '@/lib/marketplaces'
import { cn } from '@/lib/utils'

// Dark-mode-safe accent per marketplace
const BADGE_DARK: Record<string, string> = {
  mercadolivre: 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400',
  shopee:       'bg-orange-500/10 border border-orange-500/20 text-orange-400',
  amazon:       'bg-amber-500/10  border border-amber-500/20  text-amber-400',
}

const DOT_COLOR: Record<string, string> = {
  mercadolivre: 'bg-yellow-400',
  shopee:       'bg-orange-400',
  amazon:       'bg-amber-400',
}

export function MarketplaceBadge({
  marketplace,
  size = 'sm',
}: {
  marketplace: Marketplace
  size?: 'xs' | 'sm'
}) {
  const def        = getMP(marketplace)
  const badgeCls   = BADGE_DARK[marketplace] ?? 'bg-white/[0.06] border border-white/10 text-white/60'
  const dotCls     = DOT_COLOR[marketplace]  ?? 'bg-white/40'

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      badgeCls,
      size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotCls)} />
      {def.label}
    </span>
  )
}
