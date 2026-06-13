'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { MARKETPLACE_LIST } from '@/lib/marketplaces'
import {
  ShoppingCart, MessageSquare, Megaphone,
  Users, Building2, LogOut, ChevronDown,
  PanelLeftClose, PanelLeftOpen, ChevronRight, LayoutGrid,
  UserCog, Crown, Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, Role } from '@/lib/session'
import { useState, useEffect } from 'react'

const mainNav = [
  { href: '/visao-geral', icon: LayoutGrid,    label: 'Visão Geral',  roles: ['ADMIN', 'ASSESSOR', 'CLIENT'] },
  { href: '/vendas',      icon: ShoppingCart,   label: 'Vendas',       roles: ['ADMIN', 'ASSESSOR', 'CLIENT'] },
  { href: '/feedbacks',   icon: MessageSquare,  label: 'Avaliações',   roles: ['ADMIN', 'ASSESSOR', 'CLIENT'] },
  { href: '/anuncios',    icon: Megaphone,      label: 'Anúncios',     roles: ['ADMIN', 'ASSESSOR', 'CLIENT'] },
  { href: '/minha-conta', icon: UserCog,        label: 'Meu Perfil',   roles: ['ADMIN', 'ASSESSOR', 'CLIENT'] },
]

const adminNav = [
  { href: '/admin/usuarios',      icon: Users,     label: 'Usuários' },
  { href: '/admin/clientes',      icon: Building2, label: 'Clientes' },
  { href: '/admin/planos',        icon: Crown,     label: 'Planos' },
  { href: '/admin/vendas-import', icon: Upload,    label: 'Importar Vendas' },
]

interface SidebarProps {
  clients?: { id: string; name: string; slug: string }[]
  selectedClientId?: string
  onClientChange?: (clientId: string) => void
}

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

function NavItem({ href, icon: Icon, label, active, collapsed }: {
  href: string; icon: React.ElementType; label: string; active: boolean; collapsed: boolean
}) {
  return (
    <Link href={href} className={cn(
      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
      active
        ? 'nav-active-glow text-white'
        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
      collapsed && 'justify-center px-2.5'
    )}>
      <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-transform duration-200', !active && 'group-hover:scale-110')} />
      {!collapsed && <span className="truncate">{label}</span>}
      {active && !collapsed && <ChevronRight className="h-3 w-3 ml-auto opacity-70" />}
      <Tooltip label={label} show={collapsed} />
    </Link>
  )
}

export function Sidebar({ clients = [], selectedClientId, onClientChange }: SidebarProps) {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any
  const role: Role | undefined = user?.role

  const [collapsed, setCollapsed]   = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [mounted, setMounted]       = useState(false)

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
    if (next) setClientOpen(false)
  }

  const visibleNav   = mainNav.filter(item => !role || item.roles.includes(role))
  const selectedClient = clients.find(c => c.id === selectedClientId)

  const width = mounted ? (collapsed ? 64 : 240) : 240

  return (
    <aside
      style={{ width }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06] bg-[#07090f] sidebar-transition overflow-hidden"
    >
      <div className="pointer-events-none absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent" />

      {/* ── Logo + toggle ── */}
      <div className={cn(
        'relative flex h-14 items-center border-b border-white/[0.06] shrink-0',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-400 shadow-md shadow-primary/50">
              <span className="text-[11px] font-black text-white tracking-tighter">M</span>
              <div className="absolute inset-0 rounded-lg bg-primary blur-sm opacity-40 -z-10 scale-150" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-black leading-tight tracking-tight truncate text-gradient">merly</p>
              <p className="text-[10px] leading-tight text-white/30">Gestão unificada</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-400 shadow-md shadow-primary/50">
            <span className="text-[11px] font-black text-white tracking-tighter">M</span>
            <div className="absolute inset-0 rounded-lg bg-primary blur-sm opacity-40 -z-10 scale-150" />
          </div>
        )}
        <button
          onClick={toggle}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0',
            collapsed && 'hidden'
          )}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 px-2">

        {collapsed && (
          <button
            onClick={toggle}
            className="group relative flex w-full items-center justify-center rounded-xl p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground mb-1"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
            <Tooltip label="Expandir menu" show={collapsed} />
          </button>
        )}

        {/* ── Client filter (assessor/admin only, multi-client) ── */}
        {!collapsed && clients.length > 1 && onClientChange && role !== 'CLIENT' && (
          <div className="mb-2 px-1">
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Cliente
            </p>
            <div className="relative">
              <button
                onClick={() => setClientOpen(v => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <span className="truncate">{selectedClient?.name ?? 'Todos os clientes'}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200', clientOpen && 'rotate-180')} />
              </button>
              {clientOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                  <button
                    className={cn('flex w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-left', !selectedClientId && 'bg-primary/10 text-primary font-medium')}
                    onClick={() => { onClientChange(''); setClientOpen(false) }}
                  >
                    Todos os clientes
                  </button>
                  {clients.map(c => (
                    <button key={c.id}
                      className={cn('flex w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-left', selectedClientId === c.id && 'bg-primary/10 text-primary font-medium')}
                      onClick={() => { onClientChange(c.id); setClientOpen(false) }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main nav ── */}
        {!collapsed && (
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">Menu</p>
        )}
        <div className="space-y-0.5">
          {visibleNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return <NavItem key={item.href} {...item} active={active} collapsed={collapsed} />
          })}
        </div>

        {/* ── Admin nav ── */}
        {role === 'ADMIN' && (
          <div className="mt-3 space-y-0.5">
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">Admin</p>
            )}
            {collapsed && <div className="my-1 mx-2 border-t border-border/60" />}
            {adminNav.map(item => {
              const active = pathname.startsWith(item.href)
              return <NavItem key={item.href} {...item} active={active} collapsed={collapsed} />
            })}
          </div>
        )}

        {/* ── Integrations status ── */}
        {!collapsed && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25">Integrações</p>
            <div className="space-y-1">
              {MARKETPLACE_LIST.map(mp => (
                <div key={mp.key} className="flex items-center justify-between rounded-xl px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', mp.tailwind.dot)} />
                    <span className="text-xs font-medium text-white/60">{mp.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400/80">Ativo</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mt-2 space-y-1.5 px-1">
            {MARKETPLACE_LIST.map(mp => (
              <div key={mp.key} className="group relative flex justify-center">
                <span className={cn('h-2 w-2 rounded-full animate-pulse', mp.tailwind.dot)} />
                <Tooltip label={`${mp.label} — Ativo`} show={collapsed} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── User footer ── */}
      <div className="border-t border-border shrink-0 p-2">
        <div className={cn('flex items-center gap-2.5 rounded-xl px-2 py-2', collapsed && 'justify-center px-1')}>
          <div className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
            <Tooltip label={`${user?.name ?? 'Usuário'} · ${role ? ROLE_LABELS[role as Role] : ''}`} show={collapsed} />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name ?? 'Usuário'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{role ? ROLE_LABELS[role as Role] : ''}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Sair"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="group relative mt-1 flex w-full items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
            <Tooltip label="Sair" show={collapsed} />
          </button>
        )}
      </div>
    </aside>
  )
}
