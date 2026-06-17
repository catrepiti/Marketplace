'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, Rocket, CheckCircle2, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  features: string
  maxAccounts: number
}

function CadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planIdParam = searchParams.get('plano')

  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(planIdParam)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'plan' | 'form'>(planIdParam ? 'form' : 'plan')

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(data => {
        setPlans(data)
        if (planIdParam && data.some((p: Plan) => p.id === planIdParam)) {
          setSelectedPlan(planIdParam)
          setStep('form')
        }
      })
      .catch(() => {})
  }, [planIdParam])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return null
    if (pw.length < 6) return { label: 'Muito fraca', color: 'bg-red-400', width: '25%' }
    if (pw.length < 8) return { label: 'Fraca', color: 'bg-orange-400', width: '50%' }
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Média', color: 'bg-yellow-400', width: '75%' }
    return { label: 'Forte', color: 'bg-green-500', width: '100%' }
  }

  const strength = passwordStrength(form.password)
  const activePlan = plans.find(p => p.id === selectedPlan)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        planId: selectedPlan,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    setSuccess(true)
    setTimeout(async () => {
      const login = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      router.push(login?.error ? '/login' : '/visao-geral')
    }, 1500)
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl: '/visao-geral' })
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060b14] p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Conta criada!</h2>
          <p className="text-sm text-white/40">
            {activePlan && <>Plano <span className="text-white/70 font-medium">{activePlan.name}</span> ativado. </>}
            Seu teste grátis de 7 dias começou.
          </p>
          <p className="text-xs text-white/25">Entrando automaticamente...</p>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#060b14] text-white">

      {/* Left: branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-600/5" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
              <span className="text-xs font-black">M</span>
            </div>
            <span className="text-lg font-black">merly</span>
          </Link>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Gerencie todos os seus<br />
            marketplaces em<br />
            <span className="text-primary">um só lugar.</span>
          </h2>
          <div className="space-y-3">
            {[
              'Mercado Livre, Shopee e Amazon integrados',
              'Dashboard com métricas em tempo real',
              'Avaliações e vendas centralizadas',
              '7 dias grátis para experimentar',
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm text-white/50">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/15">&copy; {new Date().getFullYear()} merly. Todos os direitos reservados.</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                <span className="text-sm font-black">M</span>
              </div>
            </Link>
            <span className="text-lg font-black">merly</span>
          </div>

          {/* ── Step 1: Plan selection ── */}
          {step === 'plan' && (
            <div>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold mb-1">Escolha seu plano</h1>
                <p className="text-sm text-white/30">Todos incluem 7 dias grátis</p>
              </div>
              <div className="space-y-3">
                {plans.map(plan => {
                  const features: string[] = (() => { try { return JSON.parse(plan.features) } catch { return [] } })()
                  const isSelected = selectedPlan === plan.id
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={cn(
                        'w-full text-left rounded-xl border p-4 transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{plan.name}</span>
                        <span className="text-sm font-bold">
                          {plan.price > 2000 ? 'Sob consulta' : `R$ ${plan.price}/mês`}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/25 mb-2">
                        Até {plan.maxAccounts} marketplace{plan.maxAccounts > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {features.slice(0, 3).map((f, i) => (
                          <span key={i} className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                        {features.length > 3 && (
                          <span className="text-[10px] text-white/20 px-1">+{features.length - 3}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              <Button
                className="w-full mt-5"
                disabled={!selectedPlan}
                onClick={() => setStep('form')}
              >
                Continuar
              </Button>
              <p className="mt-4 text-center text-xs text-white/20">
                Já tem conta?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Registration form ── */}
          {step === 'form' && (
            <div>
              <button
                onClick={() => setStep('plan')}
                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 mb-5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Trocar plano
              </button>

              {activePlan && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40">Plano selecionado</p>
                    <p className="text-sm font-semibold">{activePlan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {activePlan.price > 2000 ? 'Sob consulta' : `R$ ${activePlan.price}/mês`}
                    </p>
                    <p className="text-[10px] text-emerald-400">7 dias grátis</p>
                  </div>
                </div>
              )}

              <h1 className="text-xl font-bold mb-1">Criar conta</h1>
              <p className="text-sm text-white/30 mb-5">Preencha seus dados para começar</p>

              {/* OAuth */}
              <div className="space-y-2 mb-5">
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={!!oauthLoading || loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continuar com Google
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#060b14] px-2 text-white/20">ou</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">Nome completo</label>
                  <Input
                    placeholder="João Silva"
                    value={form.name}
                    onChange={set('name')}
                    required
                    autoComplete="name"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
                  <Input
                    type="email"
                    placeholder="joao@empresa.com"
                    value={form.email}
                    onChange={set('email')}
                    required
                    autoComplete="email"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">Senha</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={form.password}
                      onChange={set('password')}
                      required
                      autoComplete="new-password"
                      className="pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {strength && (
                    <div className="mt-1.5">
                      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                      </div>
                      <p className="text-[10px] text-white/25 mt-0.5">{strength.label}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">Confirmar senha</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={form.confirm}
                    onChange={set('confirm')}
                    required
                    autoComplete="new-password"
                    className={cn(
                      'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20',
                      form.confirm && form.confirm !== form.password && 'border-red-500 ring-1 ring-red-500'
                    )}
                  />
                  {form.confirm && form.confirm !== form.password && (
                    <p className="text-[10px] text-red-400 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                {error && (
                  <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 font-medium">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading || (!!form.confirm && form.confirm !== form.password)}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {loading ? 'Criando conta...' : 'Começar teste grátis'}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-white/20">
                Já tem conta?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#060b14]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CadastroForm />
    </Suspense>
  )
}
