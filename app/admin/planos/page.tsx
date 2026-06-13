'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Check, X, Crown, Star, Zap, GripVertical } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  features: string
  maxAccounts: number
  active: boolean
  sortOrder: number
  _count?: { clients: number }
}

const emptyPlan = { name: '', price: 0, interval: 'monthly', features: '[]', maxAccounts: 3, active: true, sortOrder: 0 }

const PLAN_ICONS = [Crown, Star, Zap]

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyPlan)
  const [featureInput, setFeatureInput] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/plans')
    if (res.ok) setPlans(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(p: Plan) {
    setEditing(p.id)
    setCreating(false)
    const feats = (() => { try { return JSON.parse(p.features) } catch { return [] } })()
    setForm({ name: p.name, price: p.price, interval: p.interval, features: p.features, maxAccounts: p.maxAccounts, active: p.active, sortOrder: p.sortOrder })
    setFeatures(feats)
    setFeatureInput('')
  }

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setForm(emptyPlan)
    setFeatures([])
    setFeatureInput('')
  }

  function cancel() {
    setEditing(null)
    setCreating(false)
    setForm(emptyPlan)
    setFeatures([])
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, features, price: Number(form.price), maxAccounts: Number(form.maxAccounts) }

    if (editing) {
      await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing, ...payload }),
      })
    } else {
      await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSaving(false)
    cancel()
    load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este plano?')) return
    await fetch('/api/admin/plans', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  function addFeature() {
    const f = featureInput.trim()
    if (f && !features.includes(f)) {
      setFeatures([...features, f])
      setFeatureInput('')
    }
  }

  function removeFeature(idx: number) {
    setFeatures(features.filter((_, i) => i !== idx))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os planos de assinatura dos seus clientes</p>
        </div>
        <button
          onClick={startCreate}
          disabled={creating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Novo Plano
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Criar Plano</h2>
          <PlanForm
            form={form}
            setForm={setForm}
            features={features}
            featureInput={featureInput}
            setFeatureInput={setFeatureInput}
            addFeature={addFeature}
            removeFeature={removeFeature}
          />
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving || !form.name} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              <Check className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={cancel} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium">
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Plans grid */}
      {plans.length === 0 && !creating ? (
        <div className="text-center py-16 text-muted-foreground">
          <Crown className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum plano cadastrado</p>
          <p className="text-sm mt-1">Crie seu primeiro plano para atribuir aos clientes</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p, idx) => {
            const Icon = PLAN_ICONS[idx % PLAN_ICONS.length]
            const feats: string[] = (() => { try { return JSON.parse(p.features) } catch { return [] } })()
            const isEditing = editing === p.id

            if (isEditing) {
              return (
                <div key={p.id} className="bg-card border-2 border-blue-500/50 rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold">Editando Plano</h3>
                  <PlanForm
                    form={form}
                    setForm={setForm}
                    features={features}
                    featureInput={featureInput}
                    setFeatureInput={setFeatureInput}
                    addFeature={addFeature}
                    removeFeature={removeFeature}
                  />
                  <div className="flex gap-2">
                    <button onClick={save} disabled={saving || !form.name} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> {saving ? '...' : 'Salvar'}
                    </button>
                    <button onClick={cancel} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-medium">
                      <X className="h-3.5 w-3.5" /> Cancelar
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={p.id} className={`relative bg-card border border-border rounded-2xl p-6 transition-all hover:border-blue-500/30 ${!p.active ? 'opacity-60' : ''}`}>
                {!p.active && (
                  <span className="absolute top-3 right-3 text-[10px] font-medium bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Inativo</span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p._count?.clients ?? 0} cliente(s)</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-sm text-muted-foreground">/{p.interval === 'monthly' ? 'mês' : 'ano'}</span>
                </div>

                <div className="text-xs text-muted-foreground mb-1">Até {p.maxAccounts} contas marketplace</div>

                {feats.length > 0 && (
                  <ul className="space-y-1.5 mt-3 mb-4">
                    {feats.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button onClick={() => startEdit(p)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button onClick={() => remove(p.id)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors ml-auto">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PlanForm({ form, setForm, features, featureInput, setFeatureInput, addFeature, removeFeature }: {
  form: typeof emptyPlan
  setForm: (f: typeof emptyPlan) => void
  features: string[]
  featureInput: string
  setFeatureInput: (s: string) => void
  addFeature: () => void
  removeFeature: (i: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Profissional"
            className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Preço (R$)</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={e => setForm({ ...form, price: Number(e.target.value) })}
            className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Intervalo</label>
          <select
            value={form.interval}
            onChange={e => setForm({ ...form, interval: e.target.value })}
            className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Máx. contas</label>
          <input
            type="number"
            value={form.maxAccounts}
            onChange={e => setForm({ ...form, maxAccounts: Number(e.target.value) })}
            className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="rounded"
            />
            Ativo
          </label>
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Recursos inclusos</label>
        <div className="flex gap-2">
          <input
            value={featureInput}
            onChange={e => setFeatureInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            placeholder="Ex: Dashboard em tempo real"
            className="flex-1 bg-white/5 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button onClick={addFeature} className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg text-sm">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {features.map((f, i) => (
              <span key={i} className="flex items-center gap-1 bg-blue-500/10 text-blue-300 text-xs px-2.5 py-1 rounded-full">
                {f}
                <button onClick={() => removeFeature(i)} className="hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
