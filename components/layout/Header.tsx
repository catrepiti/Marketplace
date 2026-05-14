'use client'
import { usePathname } from 'next/navigation'
import { RefreshCw, ChevronRight, Search, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme/ThemeProvider'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/layout/NotificationBell'

interface HeaderProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
  refreshing?: boolean
  action?: React.ReactNode
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  vendas:    'Vendas',
  feedbacks: 'Feedbacks',
  anuncios:  'Anúncios',
  admin:     'Admin',
  clientes:  'Clientes',
  usuarios:  'Usuários',
  cliente:   'Meu Painel',
  pedidos:   'Pedidos',
  conectar:  'Conectar',
}

function Breadcrumb() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length <= 1) return null
  return (
    <nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
            <span className={cn(isLast ? 'text-foreground font-medium' : '')}>
              {ROUTE_LABELS[part] ?? part}
            </span>
          </span>
        )
      })}
    </nav>
  )
}

export function Header({ title, subtitle, onRefresh, refreshing, action }: HeaderProps) {
  const today = formatDate(new Date().toISOString())
  const { theme, toggle } = useTheme()

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#07090f]/80 px-6 backdrop-blur-xl shrink-0 gap-4">
      <div className="min-w-0 flex-1">
        <Breadcrumb />
        <h1 className="text-[15px] font-bold text-white leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-white/35 leading-tight truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {action}

        <button className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-white/40 hover:text-white/80 hover:border-primary/40 hover:bg-white/[0.07] transition-all duration-200">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden lg:inline-flex items-center rounded border border-border bg-muted px-1 py-0.5 text-[9px] font-medium leading-none">⌘K</kbd>
        </button>

        <span className="hidden sm:block text-[11px] text-white/25 px-1">{today}</span>

        {/* Dark mode toggle */}
        <Button
          variant="ghost" size="icon"
          onClick={toggle}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className="h-8 w-8"
        >
          {theme === 'dark'
            ? <Sun  className="h-3.5 w-3.5 text-yellow-400" />
            : <Moon className="h-3.5 w-3.5" />
          }
        </Button>

        {onRefresh && (
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={refreshing} title="Atualizar" className="h-8 w-8">
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          </Button>
        )}

        <NotificationBell />
      </div>
    </header>
  )
}
