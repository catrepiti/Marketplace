'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import {
  KeyRound, CheckCircle2, Loader2, Mail, Shield, Calendar,
  Pencil, X, Check, Crown, Eye, EyeOff, Building2, Store,
  ShoppingBag, TrendingUp, Users, FileText, Wifi, WifiOff,
  LogOut, ChevronRight, Package, DollarSign, BarChart3,
  Clock, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, Role } from '@/lib/session'

const MP_META: Record<string, { label: string; color: string; bg: string }> = {
  MERCADOLIVRE: { label: 'Mercado Livre', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  SHOPEE:       { label: 'Shopee',        color: 'text-orange-400', bg: 'bg-orange-400/10' },
  AMAZON:       { label: 'Amazon',        color: 'text-blue-400',   bg: 'bg-blue-400/10' },
}

export default function MinhaContaPage() {
  const { data: session, update: updateSession } = useSession()
  const user = session?.user as any
  const role: Role | undefined = user?.role

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })

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

  if (loading) return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Meu Perfil" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    </div>
  )

  const client = profile?.client
  const stats = profile?.stats
  const recentSales: any[] = profile?.recentSales ?? []
  const accounts: any[] = client?.marketplaceAccounts ?? []
  const connectedCount = accounts.filter((a: any) => a.connected).length
  const planFeatures: string[] = (() => { try { return JSON.parse(client?.plan?.features ?? '[]') } catch { return [] } })()

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const daysSinceMember = profile?.createdAt
    ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000)
    : 0

  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Meu Perfil" />

      <div className="flex-1 overflow-y-auto">

        {/* ── Hero profile ── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-primary/5 to-purple-600/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="relative px-6 pt-8 pb-6 max-w-5xl mx-auto">
            <div className="flex items-start gap-5">
              <div className="h-[88px] w-[88px] rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-blue-400 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-primary/30 shrink-0 ring-4 ring-[#060b14]">
                {profile?.name?.charAt(0) ?? profile?.email?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                {editingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      autoFocus
                      className="text-xl font-bold text-white bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-xs"
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                    />
                    <button onClick={saveName} disabled={savingName || !nameValue.trim()} className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center disabled:opacity-40 transition-colors">
                      {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { setEditingName(false); setNameValue(profile?.name ?? '') }} className="h-9 w-9 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 flex items-center justify-center transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 mb-1">
                    <h1 className="text-xl font-bold text-white truncate">{profile?.name ?? 'Sem nome'}</h1>
                    <button onClick={() => setEditingName(true)} className="h-7 w-7 rounded-lg bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/60 flex items-center justify-center transition-all" title="Editar nome">
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-white/40">
                    <Mail className="h-3.5 w-3.5" /> {profile?.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    <Shield className="h-3 w-3" />
                    {role ? ROLE_LABELS[role] : '—'}
                  </span>
                  {client && (
                    <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.06] text-white/50">
                      <Building2 className="h-3 w-3" />
                      {client.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/20">
                  <Calendar className="h-3 w-3" />
                  Membro desde {memberSince} &middot; {daysSinceMember} dias na plataforma
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 max-w-5xl mx-auto space-y-5 mt-2">

          {/* ── Stats row (only if client with data) ── */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={DollarSign} label="Faturamento 30d" value={`R$ ${(stats.revenue30d ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="text-emerald-400" bg="bg-emerald-400/10" />
              <StatCard icon={ShoppingBag} label="Vendas 30d" value={String(stats.totalSales30d ?? 0)} color="text-blue-400" bg="bg-blue-400/10" />
              <StatCard icon={Store} label="Marketplaces" value={`${connectedCount} conectado(s)`} color="text-yellow-400" bg="bg-yellow-400/10" />
              <StatCard icon={Package} label="Total de vendas" value={String(stats.totalSalesAll ?? 0)} color="text-purple-400" bg="bg-purple-400/10" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* ── Marketplaces conectados ── */}
              {accounts.length > 0 && (
                <Section icon={Store} title="Marketplaces Conectados" badge={`${connectedCount}/${accounts.length}`}>
                  <div className="space-y-2">
                    {accounts.map((a: any, i: number) => {
                      const meta = MP_META[a.marketplace] ?? { label: a.marketplace, color: 'text-white/60', bg: 'bg-white/5' }
                      return (
                        <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', meta.bg)}>
                              <Store className={cn('h-4 w-4', meta.color)} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{meta.label}</p>
                              <p className="text-[11px] text-white/30">{a.accountName || 'Conta vinculada'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.connected ? (
                              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                <Wifi className="h-3 w-3" /> Conectado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-medium text-white/30 bg-white/5 px-2.5 py-1 rounded-full">
                                <WifiOff className="h-3 w-3" /> Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              )}

              {/* ── Vendas recentes ── */}
              {recentSales.length > 0 && (
                <Section icon={BarChart3} title="Vendas Recentes" badge={`${stats?.totalSalesAll ?? 0} total`}>
                  <div className="space-y-1">
                    {recentSales.map((s: any) => {
                      const meta = MP_META[s.marketplace] ?? { label: s.marketplace, color: 'text-white/50', bg: 'bg-white/5' }
                      return (
                        <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                              <Package className={cn('h-3.5 w-3.5', meta.color)} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{s.product}</p>
                              <p className="text-[10px] text-white/25">{meta.label} &middot; {new Date(s.saleDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-semibold text-white">R$ {s.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p className={cn('text-[10px] font-medium', s.status === 'paid' ? 'text-emerald-400' : 'text-yellow-400')}>
                              {s.status === 'paid' ? 'Pago' : s.status}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              )}

              {/* ── Empty state for clients without data ── */}
              {client && !stats?.totalSalesAll && accounts.length === 0 && (
                <Section icon={Sparkles} title="Comece agora">
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="text-sm text-white/50 mb-1">Nenhum marketplace conectado ainda</p>
                    <p className="text-xs text-white/20">Solicite ao administrador a conexão da sua loja para começar a ver seus dados aqui.</p>
                  </div>
                </Section>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="space-y-5">

              {/* ── Plano ── */}
              {client && (
                <Section icon={Crown} title="Meu Plano" iconColor="text-yellow-400">
                  {client.plan ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{client.plan.name}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">Ativo</span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-2xl font-black text-white">R$ {client.plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs text-white/25">/{client.plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
                      </div>
                      {planFeatures.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {planFeatures.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-white/50">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="text-[10px] text-white/15 flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        Até {client.plan.maxAccounts} contas marketplace
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Crown className="h-8 w-8 mx-auto mb-2 text-white/10" />
                      <p className="text-xs text-white/30">Nenhum plano atribuído</p>
                      <p className="text-[10px] text-white/15 mt-1">Fale com o administrador</p>
                    </div>
                  )}
                </Section>
              )}

              {/* ── Segurança ── */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => { setPwOpen(!pwOpen); setPwError(''); setPwSuccess(false) }}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="h-4 w-4 text-white/30" />
                    <span className="text-sm font-semibold text-white">Alterar Senha</span>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-white/20 transition-transform', pwOpen && 'rotate-90')} />
                </button>

                {pwOpen && (
                  <form onSubmit={handlePw} className="px-5 pb-5 space-y-3 border-t border-white/[0.04] pt-4">
                    {([
                      { key: 'currentPassword' as const, label: 'Senha atual', ph: 'Sua senha atual', s: 'current' as const },
                      { key: 'newPassword' as const, label: 'Nova senha', ph: 'Mín. 6 caracteres', s: 'new' as const },
                      { key: 'confirm' as const, label: 'Confirmar nova senha', ph: 'Repita a nova senha', s: 'confirm' as const },
                    ]).map(({ key, label, ph, s }) => (
                      <div key={key}>
                        <label className="block text-[11px] font-medium text-white/30 mb-1">{label}</label>
                        <div className="relative">
                          <input
                            type={showPw[s] ? 'text' : 'password'}
                            value={pwForm[key]}
                            onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={ph}
                            required
                            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/12 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                          />
                          <button type="button" onClick={() => setShowPw(p => ({ ...p, [s]: !p[s] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 transition-colors">
                            {showPw[s] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    {pwError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{pwError}</p>}
                    {pwSuccess && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Senha alterada!
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold bg-gradient-to-r from-primary to-blue-400 text-white shadow-md shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 transition-all"
                    >
                      {pwLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Salvar nova senha
                    </button>
                  </form>
                )}
              </div>

              {/* ── Info ── */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
                <h3 className="text-xs font-semibold text-white/20 uppercase tracking-wider">Informações da Conta</h3>
                <InfoRow icon={Mail} label="E-mail" value={profile?.email} />
                <InfoRow icon={Shield} label="Função" value={role ? ROLE_LABELS[role] : '—'} />
                <InfoRow icon={Calendar} label="Membro desde" value={memberSince} />
                <InfoRow icon={Clock} label="Dias ativo" value={`${daysSinceMember} dias`} />
                {client && <InfoRow icon={Building2} label="Empresa" value={client.name} />}
                {stats && <InfoRow icon={Users} label="Usuários" value={`${stats.totalUsers}`} />}
                {stats && <InfoRow icon={FileText} label="Documentos" value={`${stats.totalDocuments}`} />}
              </div>

              {/* ── Logout ── */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 py-3 text-sm font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, badge, iconColor, children }: {
  icon: React.ElementType; title: string; badge?: string; iconColor?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', iconColor ?? 'text-white/30')} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        {badge && <span className="text-[10px] font-medium text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: string; color: string; bg: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center mb-3', bg)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <p className="text-lg font-bold text-white truncate">{value}</p>
      <p className="text-[10px] font-medium text-white/25 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-[12px] text-white/25">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-[12px] font-medium text-white/60 truncate ml-3 max-w-[180px] text-right">{value}</p>
    </div>
  )
}
