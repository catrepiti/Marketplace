'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import {
  KeyRound, CheckCircle2, Loader2, User, Mail, Shield,
  Calendar, Pencil, X, Check, Crown, Eye, EyeOff, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, Role } from '@/lib/session'

interface UserProfile {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  client?: {
    id: string
    name: string
    plan?: {
      id: string
      name: string
      price: number
      interval: string
      features: string
    } | null
  } | null
}

export default function MinhaContaPage() {
  const { data: session, update: updateSession } = useSession()
  const user = session?.user as any
  const role: Role | undefined = user?.role

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  const loadProfile = useCallback(async () => {
    const res = await fetch('/api/me')
    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setNameValue(data.name ?? '')
    }
    setLoadingProfile(false)
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  async function saveName() {
    setSavingName(true)
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameValue }),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(p => p ? { ...p, name: data.name } : p)
      setEditingName(false)
      updateSession({ name: data.name })
    }
    setSavingName(false)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('As senhas novas não coincidem'); return }
    if (pwForm.newPassword.length < 6) { setPwError('Nova senha deve ter no mínimo 6 caracteres'); return }
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
    setShowPasswords({ current: false, new: false, confirm: false })
  }

  const planFeatures: string[] = (() => {
    try { return JSON.parse(profile?.client?.plan?.features ?? '[]') }
    catch { return [] }
  })()

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const roleIcon = role === 'ADMIN' ? Shield
    : role === 'CLIENT' ? Building2
    : User

  const RoleIcon = roleIcon

  if (loadingProfile) return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Minha Conta" subtitle="Configurações do seu acesso" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Minha Conta" subtitle="Gerencie seu perfil e segurança" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Profile card ── */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600/20 via-primary/10 to-purple-600/20 relative">
              <div className="absolute -bottom-10 left-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-blue-400 border-4 border-[#060b14] flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-primary/30">
                  {profile?.name?.charAt(0) ?? profile?.email?.charAt(0) ?? '?'}
                </div>
              </div>
            </div>

            <div className="pt-14 pb-6 px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        value={nameValue}
                        onChange={e => setNameValue(e.target.value)}
                        autoFocus
                        className="text-lg font-bold text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full max-w-xs"
                        onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      />
                      <button onClick={saveName} disabled={savingName || !nameValue.trim()} className="h-8 w-8 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center disabled:opacity-40">
                        {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => { setEditingName(false); setNameValue(profile?.name ?? '') }} className="h-8 w-8 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 flex items-center justify-center">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-white truncate">{profile?.name ?? 'Sem nome'}</h2>
                      <button onClick={() => setEditingName(true)} className="h-7 w-7 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 flex items-center justify-center transition-colors" title="Editar nome">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-white/40">{profile?.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    <RoleIcon className="h-3.5 w-3.5" />
                    {role ? ROLE_LABELS[role] : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Info grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoCard icon={Mail} label="E-mail" value={profile?.email ?? '—'} />
            <InfoCard icon={Calendar} label="Membro desde" value={memberSince} />
            <InfoCard icon={Shield} label="Função" value={role ? ROLE_LABELS[role] : '—'} />
          </div>

          {/* ── Client plan (only for CLIENT role) ── */}
          {profile?.client && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-white">Meu Plano</h3>
              </div>
              <div className="p-6">
                {profile.client.plan ? (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-white">{profile.client.plan.name}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Ativo</span>
                      </div>
                      <p className="text-sm text-white/40 mb-4">Empresa: {profile.client.name}</p>
                      {planFeatures.length > 0 && (
                        <ul className="space-y-2">
                          {planFeatures.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-white">
                        R$ {profile.client.plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-white/30">
                        /{profile.client.plan.interval === 'monthly' ? 'mês' : 'ano'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Crown className="h-10 w-10 mx-auto mb-2 text-white/10" />
                    <p className="text-sm text-white/40">Nenhum plano atribuído</p>
                    <p className="text-xs text-white/20 mt-1">Entre em contato com o administrador</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Security: Change password ── */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white">Segurança</h3>
              <span className="text-[10px] text-white/20 ml-1">Altere sua senha de acesso</span>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                  { key: 'currentPassword' as const, label: 'Senha atual', placeholder: 'Sua senha atual', show: 'current' as const },
                  { key: 'newPassword' as const, label: 'Nova senha', placeholder: 'Mín. 6 caracteres', show: 'new' as const },
                  { key: 'confirm' as const, label: 'Confirmar', placeholder: 'Repita a nova senha', show: 'confirm' as const },
                ]).map(({ key, label, placeholder, show }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={showPasswords[show] ? 'text' : 'password'}
                        value={pwForm[key]}
                        onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        required
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(s => ({ ...s, [show]: !s[show] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                      >
                        {showPasswords[show] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pwError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{pwError}</p>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Senha alterada com sucesso!
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all',
                    'bg-gradient-to-r from-primary to-blue-400 text-white shadow-md shadow-primary/20 hover:shadow-primary/40',
                    pwLoading && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {pwLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Alterar senha
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-white/30" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-white/25 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-white/80 truncate">{value}</p>
      </div>
    </div>
  )
}
