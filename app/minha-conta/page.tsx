'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  KeyRound, CheckCircle2, Loader2, Mail, Shield, Calendar,
  Pencil, X, Check, Crown, Eye, EyeOff, Store, LogOut,
  User, CreditCard, Link2, Settings, AlertCircle, Clock,
  Zap, Plus, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, Role } from '@/lib/session'
import { Sidebar } from '@/components/layout/Sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const MP_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  MERCADOLIVRE: { label: 'Mercado Livre', color: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-400' },
  SHOPEE:       { label: 'Shopee',        color: 'text-orange-400', bg: 'bg-orange-400/10', dot: 'bg-orange-400' },
  AMAZON:       { label: 'Amazon',        color: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
}

type Tab = 'conta' | 'assinatura' | 'conexoes' | 'seguranca'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'conta',      label: 'Minha Conta',       icon: User },
  { key: 'assinatura', label: 'Assinatura',         icon: CreditCard },
  { key: 'conexoes',   label: 'Contas Vinculadas',  icon: Link2 },
  { key: 'seguranca',  label: 'Segurança',          icon: Settings },
]

export default function MinhaContaPage() {
  const { data: session, update: updateSession } = useSession()
  const user = session?.user as any
  const role: Role | undefined = user?.role

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('conta')

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })

  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ marketplace: '', accountName: '', sellerId: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/me')
    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setNameValue(data.name ?? '')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveName() {
    setSavingName(true)
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameValue }),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile((p: any) => p ? { ...p, name: data.name } : p)
      setEditingName(false)
      updateSession({ name: data.name })
    }
    setSavingName(false)
  }

  async function handlePw(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('As senhas não coincidem'); return }
    if (pwForm.newPassword.length < 6) { setPwError('Mínimo 6 caracteres'); return }
    setPwLoading(true)
    const res = await fetch('/api/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const data = await res.json()
    setPwLoading(false)
    if (!res.ok) { setPwError(data.error); return }
    setPwSuccess(true)
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    setShowPw({ current: false, new: false, confirm: false })
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    if (!addForm.marketplace || !addForm.accountName.trim()) {
      setAddError('Selecione o marketplace e informe o nome da conta')
      return
    }
    setAddLoading(true)
    const res = await fetch('/api/marketplace-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    const data = await res.json()
    setAddLoading(false)
    if (!res.ok) { setAddError(data.error); return }
    setShowAddModal(false)
    setAddForm({ marketplace: '', accountName: '', sellerId: '' })
    load()
  }

  async function handleDeleteAccount(accountId: string) {
    setDeleteLoading(accountId)
    const res = await fetch(`/api/marketplace-accounts?id=${accountId}`, { method: 'DELETE' })
    setDeleteLoading(null)
    if (res.ok) load()
  }

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  async function handleCheckout() {
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) {
        setCheckoutError(data.error ?? 'Erro ao iniciar o checkout')
        setCheckoutLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setCheckoutError('Erro de conexão ao iniciar o checkout')
      setCheckoutLoading(false)
    }
  }

  const client = profile?.client
  const accounts: any[] = client?.marketplaceAccounts ?? []
  const connectedCount = accounts.length
  const plan = client?.plan
  const maxAccounts = plan?.maxAccounts ?? 3
  const planFeatures: string[] = (() => { try { return JSON.parse(plan?.features ?? '[]') } catch { return [] } })()

  const trialActive = client?.trialEndsAt && new Date(client.trialEndsAt) > new Date()
  const trialDaysLeft = client?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(client.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const usedMarketplaces = accounts.map((a: any) => a.marketplace)

  return (
    <div className="flex min-h-screen bg-[#060b14]">
      <Sidebar />
      <main className="flex-1 ml-[var(--sidebar-width,240px)] sidebar-transition">

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">Configurações</h1>
              <p className="text-sm text-white/30 mt-1">Gerencie sua conta, assinatura e conexões</p>
            </div>

            <div className="flex gap-1 mb-8 border-b border-white/[0.06] -mx-1">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative',
                    tab === t.key ? 'text-white' : 'text-white/30 hover:text-white/60'
                  )}>
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              ))}
            </div>

            {/* ═══ TAB: Minha Conta ═══ */}
            {tab === 'conta' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04]">
                    <h2 className="text-sm font-semibold text-white">Dados pessoais</h2>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-primary/20 shrink-0">
                        {profile?.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1">
                        {editingName ? (
                          <div className="flex items-center gap-2">
                            <Input value={nameValue} onChange={e => setNameValue(e.target.value)} autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                              className="bg-white/[0.04] border-white/[0.08] text-white max-w-xs" />
                            <button onClick={saveName} disabled={savingName || !nameValue.trim()}
                              className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center disabled:opacity-40">
                              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button onClick={() => { setEditingName(false); setNameValue(profile?.name ?? '') }}
                              className="h-9 w-9 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 flex items-center justify-center">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{profile?.name ?? 'Sem nome'}</h3>
                            <button onClick={() => setEditingName(true)}
                              className="h-7 w-7 rounded-lg bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/50 flex items-center justify-center transition-all">
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-white/30 mt-0.5">{profile?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
                      <InfoField icon={Mail} label="E-mail" value={profile?.email} />
                      <InfoField icon={Shield} label="Tipo de acesso" value={role ? ROLE_LABELS[role] : '—'} />
                      <InfoField icon={Calendar} label="Membro desde" value={memberSince} />
                      {client && <InfoField icon={Store} label="Empresa" value={client.name} />}
                    </div>
                  </div>
                </div>
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 text-sm text-red-400/60 hover:text-red-400 transition-colors">
                  <LogOut className="h-4 w-4" /> Sair da conta
                </button>
              </div>
            )}

            {/* ═══ TAB: Assinatura ═══ */}
            {tab === 'assinatura' && (
              <div className="space-y-6">
                {trialActive && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">Período de teste ativo</p>
                      <p className="text-xs text-white/30">
                        {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''} — expira em {new Date(client.trialEndsAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-black text-primary">{trialDaysLeft}</span>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Plano atual</h2>
                    {plan && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                        Ativo
                      </span>
                    )}
                  </div>
                  {plan ? (
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1">
                            <Crown className="h-5 w-5 text-yellow-400" />
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                          </div>
                          <p className="text-xs text-white/25">Até {plan.maxAccounts} contas de marketplace</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-sm text-white/40">R$</span>
                            <span className="text-2xl font-black text-white">{plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <p className="text-[11px] text-white/20">/{plan.interval === 'anual' ? 'mês (anual)' : 'mês'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {planFeatures.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="text-xs text-white/40">{f}</span>
                          </div>
                        ))}
                      </div>
                      {client?.subscriptionStatus !== 'active' && (
                        <div className="mt-6 pt-5 border-t border-white/[0.06]">
                          <Button onClick={handleCheckout} disabled={checkoutLoading} className="w-full sm:w-auto">
                            {checkoutLoading
                              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              : <CreditCard className="h-4 w-4 mr-2" />}
                            Assinar com Mercado Pago
                          </Button>
                          {checkoutError && (
                            <p className="text-xs text-red-400 mt-2">{checkoutError}</p>
                          )}
                          <p className="text-[11px] text-white/20 mt-2">
                            Pagamento recorrente seguro via Mercado Pago (cartão ou saldo MP). Cancele quando quiser.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center py-12">
                      <Crown className="h-10 w-10 text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-white/30 mb-1">Nenhum plano ativo</p>
                      <p className="text-xs text-white/15">Escolha um plano para acessar todas as funcionalidades</p>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04]">
                    <h2 className="text-sm font-semibold text-white">Detalhes do faturamento</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-white/30">Método de pagamento</span>
                      <span className="text-xs text-white/50">
                        {client?.subscriptionStatus === 'active' ? 'Mercado Pago (recorrente)' : 'Não configurado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                      <span className="text-xs text-white/30">Assinatura</span>
                      <span className={cn(
                        'text-xs font-medium',
                        client?.subscriptionStatus === 'active' ? 'text-emerald-400'
                          : client?.subscriptionStatus === 'pending' ? 'text-yellow-400'
                          : ['paused', 'cancelled'].includes(client?.subscriptionStatus) ? 'text-red-400'
                          : 'text-white/50'
                      )}>
                        {{
                          active: 'Ativa',
                          pending: 'Aguardando pagamento',
                          paused: 'Pausada',
                          cancelled: 'Cancelada',
                        }[client?.subscriptionStatus as string] ?? 'Nenhuma'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                      <span className="text-xs text-white/30">Status</span>
                      <span className="text-xs font-medium text-emerald-400">
                        {client?.subscriptionStatus === 'active' ? 'Assinante' : trialActive ? 'Em teste gratuito' : plan ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB: Contas Vinculadas ═══ */}
            {tab === 'conexoes' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">Contas utilizadas</span>
                    <span className="text-xs font-mono text-white/40">{connectedCount}/{maxAccounts}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(connectedCount / maxAccounts) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-white/20 mt-2">
                    Sua licença permite vincular até {maxAccounts} contas de marketplace
                  </p>
                </div>

                {/* Connected accounts */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Marketplaces conectados</h2>
                    {connectedCount < maxAccounts && (
                      <button onClick={() => { setShowAddModal(true); setAddError(''); setAddForm({ marketplace: '', accountName: '', sellerId: '' }) }}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                        <Plus className="h-3 w-3" /> Adicionar conta
                      </button>
                    )}
                  </div>

                  {accounts.length > 0 ? (
                    <div className="divide-y divide-white/[0.04]">
                      {accounts.map((a: any, i: number) => {
                        const meta = MP_META[a.marketplace] ?? { label: a.marketplace, color: 'text-white/60', bg: 'bg-white/5', dot: 'bg-white/30' }
                        return (
                          <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', meta.bg)}>
                                <Store className={cn('h-5 w-5', meta.color)} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{meta.label}</p>
                                <p className="text-xs text-white/20 mt-0.5">
                                  {a.accountName || 'Conta vinculada'}
                                  {a.createdAt && (
                                    <> · Vinculada em {new Date(a.createdAt).toLocaleDateString('pt-BR')}</>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className={cn('h-2 w-2 rounded-full', a.connected ? `animate-pulse ${meta.dot}` : 'bg-white/15')} />
                                <span className={cn('text-xs font-medium', a.connected ? 'text-emerald-400' : 'text-white/25')}>
                                  {a.connected ? 'Conectado' : 'Vinculado'}
                                </span>
                              </div>
                              <button onClick={() => handleDeleteAccount(a.id)}
                                disabled={deleteLoading === a.id}
                                className="h-8 w-8 rounded-lg bg-white/5 text-white/20 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40">
                                {deleteLoading === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center py-12">
                      <Link2 className="h-10 w-10 text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-white/30 mb-1">Nenhuma conta vinculada</p>
                      <p className="text-xs text-white/15 mb-4">Conecte seus marketplaces para começar a ver dados</p>
                      <button onClick={() => { setShowAddModal(true); setAddError(''); setAddForm({ marketplace: '', accountName: '', sellerId: '' }) }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Adicionar primeira conta
                      </button>
                    </div>
                  )}
                </div>

                {/* Available marketplaces */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04]">
                    <h2 className="text-sm font-semibold text-white">Marketplaces disponíveis</h2>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {Object.entries(MP_META).map(([key, meta]) => {
                      const hasAccount = accounts.some((a: any) => a.marketplace === key)
                      return (
                        <div key={key} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', meta.bg)}>
                              <Store className={cn('h-5 w-5', meta.color)} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{meta.label}</p>
                              <p className="text-xs text-white/20">Integração via API oficial</p>
                            </div>
                          </div>
                          {hasAccount ? (
                            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Vinculado
                            </span>
                          ) : connectedCount < maxAccounts ? (
                            <button onClick={() => { setAddForm({ marketplace: key, accountName: '', sellerId: '' }); setAddError(''); setShowAddModal(true) }}
                              className="text-xs font-medium text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1.5">
                              <Zap className="h-3 w-3" /> Conectar
                            </button>
                          ) : (
                            <span className="text-xs text-white/20">Limite atingido</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB: Segurança ═══ */}
            {tab === 'seguranca' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04]">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-white/30" /> Alterar senha
                    </h2>
                  </div>
                  <form onSubmit={handlePw} className="p-6 space-y-4">
                    {([
                      { key: 'currentPassword' as const, label: 'Senha atual', ph: 'Sua senha atual', s: 'current' as const },
                      { key: 'newPassword' as const, label: 'Nova senha', ph: 'Mínimo 6 caracteres', s: 'new' as const },
                      { key: 'confirm' as const, label: 'Confirmar nova senha', ph: 'Repita a nova senha', s: 'confirm' as const },
                    ]).map(({ key, label, ph, s }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-white/30 mb-1.5">{label}</label>
                        <div className="relative">
                          <Input
                            type={showPw[s] ? 'text' : 'password'}
                            value={pwForm[key]}
                            onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={ph}
                            required
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15 pr-10"
                          />
                          <button type="button" onClick={() => setShowPw(p => ({ ...p, [s]: !p[s] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors">
                            {showPw[s] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {pwError && (
                      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {pwError}
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Senha alterada com sucesso!
                      </div>
                    )}
                    <Button type="submit" disabled={pwLoading} className="w-full sm:w-auto">
                      {pwLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Salvar nova senha
                    </Button>
                  </form>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.04]">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-white/30" /> Sessão
                    </h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-white/30">Sessão atual</span>
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ativa
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
                      <span className="text-xs text-white/30">E-mail verificado</span>
                      <span className="text-xs text-white/50">{profile?.email}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-500/10">
                    <h2 className="text-sm font-semibold text-red-400/70">Zona de perigo</h2>
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">Encerrar sessão</p>
                      <p className="text-xs text-white/20">Você será desconectado de todos os dispositivos</p>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-400/70 bg-red-500/5 border border-red-500/15 px-3 py-2 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all">
                      <LogOut className="h-3.5 w-3.5" /> Sair
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Modal: Adicionar conta ═══ */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <div className="bg-[#0c1220] border border-white/[0.08] rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Adicionar conta de marketplace</h3>
                <button onClick={() => setShowAddModal(false)} className="h-8 w-8 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 hover:text-white flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/30 mb-2">Marketplace</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(MP_META).map(([key, meta]) => {
                      const disabled = usedMarketplaces.includes(key)
                      return (
                        <button key={key} type="button" disabled={disabled}
                          onClick={() => setAddForm(f => ({ ...f, marketplace: key }))}
                          className={cn(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center',
                            addForm.marketplace === key
                              ? `${meta.bg} border-current ${meta.color}`
                              : disabled
                                ? 'border-white/[0.04] bg-white/[0.01] opacity-30 cursor-not-allowed'
                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] text-white/40'
                          )}>
                          <Store className={cn('h-5 w-5', addForm.marketplace === key ? meta.color : 'text-inherit')} />
                          <span className="text-[10px] font-semibold">{meta.label}</span>
                          {disabled && <span className="text-[9px] text-white/20">Já vinculado</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/30 mb-1.5">Nome da conta / Loja</label>
                  <Input value={addForm.accountName} onChange={e => setAddForm(f => ({ ...f, accountName: e.target.value }))}
                    placeholder="Ex: Minha Loja Oficial"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/30 mb-1.5">
                    Seller ID <span className="text-white/15">(opcional)</span>
                  </label>
                  <Input value={addForm.sellerId} onChange={e => setAddForm(f => ({ ...f, sellerId: e.target.value }))}
                    placeholder="ID do vendedor no marketplace"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/15" />
                </div>
                {addError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {addError}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addLoading || !addForm.marketplace || !addForm.accountName.trim()} className="flex-1">
                    {addLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Vincular conta
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function InfoField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-white/15" />
        <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-white/60 font-medium truncate">{value}</p>
    </div>
  )
}
