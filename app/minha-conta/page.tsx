'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { KeyRound, CheckCircle2, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, Role } from '@/lib/session'

export default function MinhaContaPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const role: Role | undefined = user?.role

  const [form, setForm]         = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (form.newPassword !== form.confirm) { setError('As senhas novas não coincidem'); return }
    if (form.newPassword.length < 6) { setError('Nova senha deve ter no mínimo 6 caracteres'); return }
    setLoading(true)
    const res = await fetch('/api/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setSuccess(true)
    setForm({ currentPassword: '', newPassword: '', confirm: '' })
  }

  return (
    <div className="flex flex-col flex-1 bg-[#060b14]">
      <Header title="Minha Conta" subtitle="Configurações do seu acesso" />
      <div className="flex-1 overflow-y-auto p-6 max-w-lg space-y-6">

        {/* Profile card */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-black text-primary">
            {user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user?.name ?? 'Usuário'}</p>
            <p className="text-xs text-white/40">{user?.email}</p>
            <span className="mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              {role ? ROLE_LABELS[role] : ''}
            </span>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white">Alterar senha</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {[
              { key: 'currentPassword', label: 'Senha atual',         placeholder: 'Digite sua senha atual' },
              { key: 'newPassword',     label: 'Nova senha',          placeholder: 'Mínimo 6 caracteres'    },
              { key: 'confirm',         label: 'Confirmar nova senha', placeholder: 'Repita a nova senha'    },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
                <input
                  type="password"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            ))}

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Senha alterada com sucesso!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity',
                'bg-gradient-to-r from-primary to-blue-400 text-white shadow-md shadow-primary/30',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar nova senha
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
