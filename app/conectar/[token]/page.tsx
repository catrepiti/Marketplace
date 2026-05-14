'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Zap, CheckCircle2, XCircle, Loader2, ChevronRight,
  ShoppingBag, Eye, EyeOff, HelpCircle, ExternalLink, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Step = 'loading' | 'invalid' | 'expired' | 'used' | 'form' | 'submitting' | 'success'

import { MARKETPLACES, MARKETPLACE_LIST } from '@/lib/marketplaces'

const MP_INFO = Object.fromEntries(
  MARKETPLACE_LIST.map(mp => [mp.keyUpper, {
    label:         mp.label,
    color:         mp.tailwind.text,
    bg:            mp.tailwind.bg,
    border:        mp.tailwind.border,
    logo:          mp.connect.logo,
    sellerIdLabel: mp.connect.sellerIdLabel,
    sellerIdHelp:  mp.connect.sellerIdHelp,
    tokenLabel:    mp.connect.tokenLabel,
    tokenHelp:     mp.connect.tokenHelp,
    tokenUrl:      mp.connect.tokenUrl,
    oauthHint:     mp.connect.oauthHint,
  }])
)

interface InviteInfo {
  clientName: string
  marketplace: string
  expiresAt: string
}

function HelpTip({ text, url }: { text: string; url?: string }) {
  return (
    <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
      <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
      <p className="text-[11px] text-blue-700 leading-relaxed">
        {text}{' '}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-0.5">
            Abrir portal <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </p>
    </div>
  )
}

export default function ConectarPage() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState<Step>('loading')
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [form, setForm] = useState({ accountName: '', sellerId: '', accessToken: '' })
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState('')
  const [activeHelp, setActiveHelp] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/connect/${token}`)
      .then(async r => {
        if (r.status === 404) { setStep('invalid'); return }
        if (r.status === 410) { setStep('expired'); return }
        if (r.status === 409) { setStep('used'); return }
        const data = await r.json()
        setInfo(data)
        setForm(f => ({ ...f, accountName: data.clientName }))
        setStep('form')
      })
      .catch(() => setStep('invalid'))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep('submitting')
    try {
      const res = await fetch(`/api/connect/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao conectar.'); setStep('form'); return }
      setStep('success')
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setStep('form')
    }
  }

  const mp = info ? MP_INFO[info.marketplace] : null

  // ── Layout wrapper ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
            <span className="text-sm font-black text-white tracking-tighter">M</span>
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 leading-tight tracking-tight">merly</p>
            <p className="text-[10px] text-slate-500 leading-tight">Conexão de conta</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-xl overflow-hidden">

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-slate-500">Verificando link…</p>
            </div>
          )}

          {/* Error states */}
          {(step === 'invalid' || step === 'expired' || step === 'used') && (
            <div className="flex flex-col items-center justify-center py-12 px-8 gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                {step === 'used' ? <CheckCircle2 className="h-7 w-7 text-green-500" /> : <XCircle className="h-7 w-7 text-red-500" />}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">
                  {step === 'invalid' ? 'Link inválido' : step === 'expired' ? 'Link expirado' : 'Conta já conectada'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {step === 'invalid' && 'Este link de conexão não existe. Solicite um novo link ao seu gestor.'}
                  {step === 'expired' && 'Este link expirou após 7 dias. Solicite um novo link ao seu gestor.'}
                  {step === 'used' && 'Sua conta já foi conectada com sucesso. Não é necessário conectar novamente.'}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          {(step === 'form' || step === 'submitting') && info && mp && (
            <>
              {/* Marketplace banner */}
              <div className={cn('px-6 py-5', mp.bg)}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{mp.logo}</span>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Conectar ao</p>
                    <p className={cn('text-lg font-bold', mp.color)}>{mp.label}</p>
                  </div>
                </div>
                <div className={cn('mt-3 rounded-lg border px-3 py-2 flex items-center gap-2', mp.border, 'bg-white/60')}>
                  <ShoppingBag className={cn('h-4 w-4 shrink-0', mp.color)} />
                  <p className="text-xs text-slate-600">
                    Conectando para <span className="font-semibold text-slate-800">{info.clientName}</span>
                  </p>
                </div>
              </div>

              {/* Steps indicator */}
              <div className="flex items-center gap-0 px-6 pt-5 pb-2">
                {['Sua loja', 'Seller ID', 'Token'].map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
                      'bg-primary text-white'
                    )}>
                      {i + 1}
                    </div>
                    <p className={cn('ml-1.5 text-[11px] font-medium text-slate-600')}>{s}</p>
                    {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 shrink-0" />}
                  </div>
                ))}
              </div>

              {/* Hint */}
              <div className="mx-6 mt-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-[11px] text-slate-600 leading-relaxed">{mp.oauthHint}</p>
                <a href={mp.tokenUrl} target="_blank" rel="noopener noreferrer"
                  className={cn('mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold', mp.color)}>
                  Abrir portal {mp.label} <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-4">
                {/* Account name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nome da sua loja <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.accountName}
                    onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
                    placeholder="Ex: Minha Loja Oficial"
                    required
                  />
                </div>

                {/* Seller ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {mp.sellerIdLabel} <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveHelp(activeHelp === 'seller' ? null : 'seller')}
                      className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <HelpCircle className="h-3.5 w-3.5" /> Onde encontrar?
                    </button>
                  </div>
                  <Input
                    value={form.sellerId}
                    onChange={e => setForm(f => ({ ...f, sellerId: e.target.value }))}
                    placeholder="Ex: 123456789"
                    required
                  />
                  {activeHelp === 'seller' && <HelpTip text={mp.sellerIdHelp} />}
                </div>

                {/* Access Token */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {mp.tokenLabel} <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveHelp(activeHelp === 'token' ? null : 'token')}
                      className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <HelpCircle className="h-3.5 w-3.5" /> Como gerar?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={form.accessToken}
                      onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                      placeholder="Cole o token aqui"
                      required
                      className="pr-9 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {activeHelp === 'token' && <HelpTip text={mp.tokenHelp} url={mp.tokenUrl} />}
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold"
                  disabled={step === 'submitting'}
                >
                  {step === 'submitting' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Conectando…</>
                  ) : (
                    <>Conectar ao {mp.label} <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>

                <p className="text-center text-[10px] text-slate-400">
                  Suas credenciais são armazenadas com segurança e usadas apenas para sincronizar os dados da sua loja.
                </p>
              </form>
            </>
          )}

          {/* Success */}
          {step === 'success' && info && mp && (
            <div className="flex flex-col items-center justify-center py-12 px-8 gap-5 text-center">
              <div className={cn('flex h-16 w-16 items-center justify-center rounded-full', mp.bg)}>
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">Conectado! 🎉</p>
                <p className={cn('text-sm font-semibold mt-0.5', mp.color)}>{mp.label}</p>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Sua loja foi conectada com sucesso ao <strong>{info.clientName}</strong>. Os dados começarão a sincronizar em breve.
                </p>
              </div>
              <div className="w-full rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-xs text-green-700 font-medium">✓ Conta conectada</p>
                <p className="text-xs text-green-600 mt-0.5">Pode fechar esta janela.</p>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          merly · Plataforma de gestão unificada
        </p>
      </div>
    </div>
  )
}
