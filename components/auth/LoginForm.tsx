'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError]               = useState('')

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) { setError('Email ou senha inválidos.'); return }
    router.push('/dashboard')
    router.refresh()
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060b14] p-4">

      {/* ── Ambient orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Main blue orb */}
        <div className="animate-float absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        {/* Cyan accent */}
        <div className="animate-float-reverse absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
        {/* Small blue left */}
        <div className="animate-float absolute top-1/2 left-0 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[90px]" style={{ animationDelay: '2s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dots opacity-30" />
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Glow ring around card */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/30 via-primary/5 to-transparent blur-sm" />

        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/60 px-8 py-9">

          {/* ── Logo ── */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary blur-xl opacity-60 scale-110" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-400 shadow-lg shadow-primary/40">
                <span className="text-2xl font-black text-white tracking-tighter leading-none">M</span>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight text-gradient">merly</h1>
              <p className="text-sm text-white/40 mt-0.5">Gestão unificada de marketplaces</p>
            </div>
          </div>

          {/* ── OAuth buttons ── */}
          <div className="space-y-2.5 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading || loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.09] hover:text-white hover:border-white/20 transition-all duration-200 disabled:opacity-40"
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

            <button
              onClick={() => handleOAuth('apple')}
              disabled={!!oauthLoading || loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.09] hover:text-white hover:border-white/20 transition-all duration-200 disabled:opacity-40"
            >
              {oauthLoading === 'apple' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              Continuar com Apple
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="relative mb-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] uppercase tracking-widest text-white/25 font-medium">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* ── Credentials form ── */}
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60 tracking-wide">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-primary/60 focus:ring-primary/20 focus-visible:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60 tracking-wide">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10 border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-primary/60 focus:ring-primary/20 focus-visible:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'group relative w-full overflow-hidden rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 disabled:opacity-60',
                'bg-gradient-to-r from-primary to-blue-400',
                'hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.01]',
                'active:scale-[0.99]'
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</>
                  : <><span>Entrar na plataforma</span><ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                }
              </span>
              {/* Shimmer sweep */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            </button>
          </form>

          {/* ── Footer links ── */}
          <div className="mt-6 space-y-1.5 text-center">
            <p className="text-xs text-white/30">
              Não tem conta?{' '}
              <Link href="/cadastro" className="text-primary/90 font-semibold hover:text-primary transition-colors">
                Criar conta grátis
              </Link>
            </p>
            <p className="text-xs text-white/20">
              Problemas?{' '}
              <a href="mailto:suporte@merly.com" className="hover:text-white/40 transition-colors underline underline-offset-2">
                Fale com o suporte
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
