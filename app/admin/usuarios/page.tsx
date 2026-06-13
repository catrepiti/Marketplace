'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Users, KeyRound } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ROLE_LABELS } from '@/lib/session'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  ASSESSOR: 'bg-blue-100 text-blue-700',
  CLIENT: 'bg-gray-100 text-gray-700',
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CLIENT', clientId: '' })
  const [resetModal, setResetModal] = useState<{ id: string; name: string } | null>(null)
  const [resetPw, setResetPw]       = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError]     = useState('')
  const [resetOk, setResetOk]           = useState(false)

  const fetchAll = async () => {
    const [u, c] = await Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/clients').then(r => r.json()),
    ])
    setUsers(u)
    setClients(c)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    setShowForm(false)
    setForm({ name: '', email: '', password: '', role: 'CLIENT', clientId: '' })
    fetchAll()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover usuário "${name}"?`)) return
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resetModal!.id, password: resetPw }),
    })
    const data = await res.json()
    setResetLoading(false)
    if (!res.ok) { setResetError(data.error); return }
    setResetOk(true)
    setTimeout(() => { setResetModal(null); setResetPw(''); setResetOk(false) }, 1500)
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      <Header title="Usuários" subtitle="Gerenciamento de acessos" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{users.length} usuários cadastrados</p>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <Plus className="h-4 w-4" /> Novo usuário
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-3"><CardTitle>Criar usuário</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Nome</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Email *</label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" required />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Senha *</label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" required />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Role *</label>
                  <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} options={[
                    { value: 'ADMIN', label: 'Administrador' },
                    { value: 'ASSESSOR', label: 'Assessoria' },
                    { value: 'CLIENT', label: 'Cliente' },
                  ]} />
                </div>
                {form.role === 'CLIENT' && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium mb-1 block">Cliente vinculado</label>
                    <Select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} placeholder="Selecione o cliente" options={clients.map((c: any) => ({ value: c.id, label: c.name }))} />
                  </div>
                )}
                {error && <p className="col-span-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                <div className="col-span-2 flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Criar usuário
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Usuário', 'Email', 'Role', 'Cliente', 'Cadastro', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any, i: number) => (
                    <tr key={u.id} className={cn('border-b border-border/50 hover:bg-muted/20', i % 2 === 1 && 'bg-muted/10')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {u.name?.charAt(0) ?? u.email.charAt(0)}
                          </div>
                          <span className="text-xs font-medium">{u.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', roleColors[u.role])}>
                          {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.client?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => { setResetModal({ id: u.id, name: u.name ?? u.email }); setResetPw(''); setResetError(''); setResetOk(false) }} title="Redefinir senha">
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(u.id, u.name ?? u.email)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Redefinir senha</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{resetModal.name}</p>
            </div>
            <form onSubmit={handleReset} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nova senha</label>
                <Input
                  type="password"
                  value={resetPw}
                  onChange={e => setResetPw(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              {resetError && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{resetError}</p>}
              {resetOk    && <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">✓ Senha redefinida!</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={resetLoading} className="flex-1">
                  {resetLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Salvar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setResetModal(null)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
