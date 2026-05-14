'use client'
import { useEffect, useState, useRef } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle2, X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClientData {
  id: string
  name: string
  trend: number
  avgRating: number
}

interface OverviewData {
  clients: ClientData[]
}

type NotifType = 'warning' | 'alert' | 'info' | 'success'

interface Notification {
  type: NotifType
  title: string
  message: string
  time: string
}

const FIXED_NOTIFICATIONS: Notification[] = [
  {
    type: 'info',
    title: 'Feedbacks pendentes',
    message: 'Você tem feedbacks aguardando resposta',
    time: '2h atrás',
  },
  {
    type: 'success',
    title: 'Sincronização completa',
    message: 'Todos os marketplaces sincronizados',
    time: '3h atrás',
  },
]

function NotifIcon({ type }: { type: NotifType }) {
  const base = 'h-6 w-6 rounded-full flex items-center justify-center shrink-0'
  if (type === 'warning') return (
    <span className={cn(base, 'bg-amber-500/20')}>
      <AlertTriangle className="h-3 w-3 text-amber-400" />
    </span>
  )
  if (type === 'alert') return (
    <span className={cn(base, 'bg-red-500/20')}>
      <Star className="h-3 w-3 text-red-400" />
    </span>
  )
  if (type === 'info') return (
    <span className={cn(base, 'bg-blue-500/20')}>
      <Info className="h-3 w-3 text-blue-400" />
    </span>
  )
  return (
    <span className={cn(base, 'bg-emerald-500/20')}>
      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
    </span>
  )
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/overview')
      .then(r => r.json())
      .then((data: OverviewData) => {
        const dynamic: Notification[] = []
        for (const client of data.clients) {
          if (dynamic.length >= 6) break
          if (client.trend < -5) {
            dynamic.push({
              type: 'warning',
              title: 'Queda de performance',
              message: `${client.name}: queda de ${Math.abs(client.trend).toFixed(1)}% no período`,
              time: 'Agora',
            })
          } else if (client.avgRating < 3.5) {
            dynamic.push({
              type: 'alert',
              title: 'Avaliação crítica',
              message: `${client.name}: média ${client.avgRating.toFixed(1)} ★`,
              time: '1h atrás',
            })
          }
        }
        const all = [...dynamic, ...FIXED_NOTIFICATIONS].slice(0, 8)
        setNotifications(all)
      })
      .catch(() => {
        setNotifications(FIXED_NOTIFICATIONS)
      })
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const count = notifications.length
  const badge = count > 9 ? '9+' : String(count)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Notificações"
        className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors"
      >
        <Bell className="h-3.5 w-3.5 text-white/60" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground px-0.5">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-80 rounded-xl border border-white/[0.08] bg-[#0d1829] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-white">Notificações</span>
            <button
              onClick={() => setNotifications([])}
              className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
            >
              Marcar todas como lidas
            </button>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] text-white/30">
              Nenhuma notificação
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto">
              {notifications.map((n, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                  <NotifIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white leading-tight">{n.title}</p>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-snug">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-white/25 shrink-0 mt-0.5">{n.time}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Close button */}
          <div className="border-t border-white/[0.06] px-4 py-2 flex justify-end">
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="h-3 w-3" />
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
