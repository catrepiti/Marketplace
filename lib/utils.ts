import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { OrderStatus } from './types'
import { MARKETPLACES, MARKETPLACE_KEYS, MarketplaceKey, getMP } from './marketplaces'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function formatTimeAgo(iso: string): string {
  const now = new Date()
  const then = new Date(iso)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`
  return formatDate(iso)
}

export const marketplaceConfig: Record<MarketplaceKey, { label: string; color: string; bg: string; dot: string }> =
  Object.fromEntries(
    MARKETPLACE_KEYS.map(k => [k, {
      label: MARKETPLACES[k].label,
      color: MARKETPLACES[k].tailwind.text,
      bg:    MARKETPLACES[k].tailwind.bg,
      dot:   MARKETPLACES[k].tailwind.dot,
    }])
  ) as Record<MarketplaceKey, { label: string; color: string; bg: string; dot: string }>

export { getMP, MARKETPLACE_KEYS, MARKETPLACE_LIST } from './marketplaces'

export const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  paid:        { label: 'Pago',               color: 'text-blue-700',   bg: 'bg-blue-100'   },
  processing:  { label: 'Em processamento',   color: 'text-purple-700', bg: 'bg-purple-100' },
  shipped:     { label: 'Enviado',            color: 'text-indigo-700', bg: 'bg-indigo-100' },
  delivered:   { label: 'Entregue',           color: 'text-green-700',  bg: 'bg-green-100'  },
  cancelled:   { label: 'Cancelado',          color: 'text-red-700',    bg: 'bg-red-100'    },
  returned:    { label: 'Devolvido',          color: 'text-gray-700',   bg: 'bg-gray-100'   },
}
