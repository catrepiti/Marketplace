'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Building2, Settings } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, marketplaceConfig } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ClientesPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', slug: '' })

  const fetchClients = () =>
    fetch('/api/admin/clients').then(r => r.json()).then(d => { setClients(d); setLoading(false) })

  useEffect(() => { fetchClients() }, [])

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error); return }
    setShowForm(false)
    setForm({ name: '', slug: '' })
    fetchClients()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover cliente "${name}" e todos os seus dados?`)) return
    await fetch(`/api/admin/clients?id=${id}`, { method: 'DELETE' })
    fetchClients()
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      <Header title="Clientes" subtitle="Gestão de contas de clientes" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{clients.length} clientes cadastrados</p>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-3"><CardTitle>Criar cliente</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Nome da empresa *</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
                    placeholder="Ex: Loja ABC"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Slug (URL) *</label>
                  <Input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: autoSlug(e.target.value) }))}
                    placeholder="loja-abc"
                    required
                  />
                </div>
                {error && <p className="col-span-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                <div className="col-span-2 flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Criar cliente
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : clients.map((client: any) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">/{client.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => router.push(`/admin/clientes/${client.id}`)} title="Configurar">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(client.id, client.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span>{client._count.users} usuário{client._count.users !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>Criado em {formatDate(client.createdAt)}</span>
                </div>

                {client.marketplaceAccounts.length > 0 ? (
                  <div className="space-y-1.5">
                    {client.marketplaceAccounts.map((acc: any) => {
                      const mp = acc.marketplace.toLowerCase() as 'mercadolivre' | 'shopee'
                      const cfg = marketplaceConfig[mp]
                      return (
                        <div key={acc.marketplace} className={cn('flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs', cfg.bg)}>
                          <span className={cn('font-medium', cfg.color)}>{cfg.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground truncate max-w-[100px]">{acc.accountName}</span>
                            <span className={cn('h-1.5 w-1.5 rounded-full', acc.status === 'active' ? 'bg-green-500' : 'bg-gray-400')} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhuma conta conectada</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
