'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LayoutDashboard, MessageSquare, ShoppingCart, Megaphone, Zap, LogOut, PanelLeftClose, PanelLeftOpen, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const nav = [
  { href: '/cliente',           icon: LayoutDashboard, label: 'Meu Painel'    },
  { href: '/cliente/pedidos',   icon: ShoppingCart,    label: 'Meus Pedidos'  },
  { href: '/cliente/feedbacks', icon: MessageSquare,   label: 'Avaliações'    },
  { href: '/cliente/anuncios',  icon: Megaphone,       label: 'Meus Anúncios' },
]

function Tooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
      whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background
      shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground" />
    </div>
  )
}

export function ClientSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any

  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true'
    setCollapsed(saved)
    setMounted(true)
    document.documentElement.style.setProperty('--sidebar-width', saved ? '64px' : '240px')
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
    document.documentElement.style.setProperty('--sidebar-width', next ? '64px' : '240px')
  }

  const width = mounted ? (collapsed ? 64 : 240) : 240

  return (
    <aside
      style={{ width }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06] bg-[#07090f] sidebar-transition overflow-hidden"
    >
      {/* ── Logo + toggle ── */}
      <div className={cn(
        'flex h-14 items-center border-b border-white/[0.06] shrink-0',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/40">
              <span className="text-[11px] font-black text-primary-foreground tracking-tighter">M</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-black leading-tight text-foreground tracking-tight truncate">merly</p>
              <p className="text-[10px] leading-tight text-muted-foreground truncate">{user?.clientName ?? 'Meu painel'}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/40">
            <span className="text-[11px] font-black text-primary-foreground tracking-tighter">M</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={toggle} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white transition-colors shrink-0">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {/* Expand button when collapsed */}
        {collapsed && (
          <button onClick={toggle} className="group relative flex w-full items-center justify-center rounded-xl p-2.5 text-white/30 hover:bg-white/[0.06] hover:text-white transition-colors mb-1">
            <PanelLeftOpen className="h-[18px] w-[18px]" />
            <Tooltip label="Expandir menu" show={collapsed} />
          </button>
        )}

        {!collapsed && (
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">Menu</p>
        )}

        {nav.map(item => {
          const active = pathname === item.href || (item.href !== '/cliente' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active ? 'nav-active-glow text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/80',
                collapsed && 'justify-center px-2.5'
              )}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
              <Tooltip label={item.label} show={collapsed} />
            </Link>
          )
        })}
      </div>

      {/* ── User footer ── */}
      <div className="border-t border-white/[0.06] shrink-0 p-2">
        <div className={cn('flex items-center gap-2.5 rounded-xl px-2 py-2', collapsed && 'justify-center px-1')}>
          <div className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
            {user?.name?.charAt(0) ?? '?'}
            <Tooltip label={user?.name ?? 'Cliente'} show={collapsed} />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'Cliente'}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })} title="Sair"
                className="rounded-lg p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="group relative mt-1 flex w-full items-center justify-center rounded-xl p-2 text-white/30 hover:bg-white/[0.06] hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
            <Tooltip label="Sair" show={collapsed} />
          </button>
        )}
      </div>
    </aside>
  )
}
