'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Building2, Users, ShoppingBag, FileText, Megaphone,
  Upload, Trash2, Loader2, Save, Eye, EyeOff, ChevronDown,
  CheckCircle2, XCircle, ExternalLink, Zap, TrendingUp, MousePointer,
  DollarSign, BarChart2, RefreshCw, Link2, Copy, X, Smartphone,
  Bell, MessageCircle, Send, AlertCircle, ToggleLeft, ToggleRight, Clock,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { MARKETPLACE_LIST, MARKETPLACES, getMPByUpper } from '@/lib/marketplaces'

type Tab = 'geral' | 'marketplace' | 'anuncios' | 'documentos' | 'notificacoes'

// ── Marketplace config (derived from central registry) ────────────────────────
const MP_CONFIG = Object.fromEntries(
  MARKETPLACE_LIST.map(mp => [mp.keyUpper, {
    label:    mp.label,
    color:    mp.tailwind.text,
    bg:       mp.tailwind.bg,
    border:   mp.tailwind.border,
    accentBg: mp.tailwind.bg,
    logo:     mp.connect.logo,
    docsUrl:  mp.connect.tokenUrl,
    basic: [
      { key: 'accountName', label: 'Nome da conta',             placeholder: `Ex: Loja Principal ${mp.label}` },
      { key: 'sellerId',    label: mp.connect.sellerIdLabel,    placeholder: `Ex: ${mp.abbr}-123456789` },
      { key: 'accessToken', label: mp.connect.tokenLabel,       placeholder: 'Token de acesso', secret: true },
    ],
    advanced: [
      { key: 'appId',        label: 'App ID / Partner ID',     placeholder: 'ID do aplicativo' },
      { key: 'appSecret',    label: 'App Secret / Partner Key',placeholder: 'Secret do aplicativo', secret: true },
      { key: 'refreshToken', label: 'Refresh Token',           placeholder: 'Token para renovação automática', secret: true },
    ],
  }])
)

// ── Ads mock data ──────────────────────────────────────────────────────────────
function generateAdsMock(clientId: string) {
  const seed = clientId.charCodeAt(0) + clientId.charCodeAt(1)
  const r = (base: number, range: number) => Math.round(base + (seed % range))

  const mlCampaigns = [
    { name: 'Fones Bluetooth - Produto', type: 'Produto', status: 'active', impressions: r(42000, 8000), clicks: r(1200, 300), spend: r(420, 80), conversions: r(38, 12) },
    { name: 'Teclados Gamer - Categoria', type: 'Categoria', status: 'active', impressions: r(28000, 5000), clicks: r(890, 200), spend: r(310, 60), conversions: r(22, 8) },
    { name: 'Mouse Logitech - Produto', type: 'Produto', status: 'paused', impressions: r(15000, 3000), clicks: r(440, 100), spend: r(180, 40), conversions: r(14, 5) },
    { name: 'Periféricos - Brand', type: 'Brand', status: 'active', impressions: r(9000, 2000), clicks: r(270, 80), spend: r(95, 20), conversions: r(9, 3) },
  ]
  const shopeeCampaigns = [
    { name: 'Smartwatch Flash Sale', type: 'Flash Sale', status: 'active', impressions: r(38000, 7000), clicks: r(1100, 250), spend: r(380, 70), conversions: r(45, 15) },
    { name: 'Skincare - Discovery Ads', type: 'Discovery', status: 'active', impressions: r(22000, 4000), clicks: r(660, 150), spend: r(240, 50), conversions: r(28, 10) },
    { name: 'Tênis Running - Search', type: 'Search', status: 'active', impressions: r(17000, 3500), clicks: r(510, 120), spend: r(195, 45), conversions: r(18, 6) },
    { name: 'Mochilas - Produto', type: 'Produto', status: 'paused', impressions: r(8000, 1500), clicks: r(240, 60), spend: r(88, 18), conversions: r(7, 3) },
  ]

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 29 + i)
    const date = d.toISOString().split('T')[0]
    const base = 12 + Math.sin(i * 0.4) * 6 + (seed % 8)
    const mpSpend = Object.fromEntries(MARKETPLACE_LIST.map((mp, j) => [
      mp.key,
      +((base * (0.9 - j * 0.1)) * (0.9 + Math.random() * 0.2)).toFixed(2),
    ]))
    return {
      date,
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d),
      ...mpSpend,
    }
  })

  return { mlCampaigns, shopeeCampaigns, days }
}

function adsSummary(campaigns: ReturnType<typeof generateAdsMock>['mlCampaigns']) {
  const impressions = campaigns.reduce((s, c) => s + c.impressions, 0)
  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0)
  const spend = campaigns.reduce((s, c) => s + c.spend, 0)
  const conversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0'
  const cpc = clicks > 0 ? (spend / clicks).toFixed(2) : '0'
  const roas = spend > 0 ? ((conversions * 180) / spend).toFixed(1) : '0'
  return { impressions, clicks, spend, conversions, ctr, cpc, roas }
}

function formatLargeNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const AdsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 shadow text-xs space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">R$ {p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('geral')

  const [mpForms, setMpForms] = useState<Record<string, Record<string, string>>>({})
  const [mpSaving, setMpSaving] = useState<Record<string, boolean>>({})
  const [mpMsg, setMpMsg] = useState<Record<string, { ok: boolean; text: string }>>({})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({})

  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [adsFilter, setAdsFilter] = useState<string>('all')
  const adsMock = client ? generateAdsMock(client.id) : null

  const [mlConnecting, setMlConnecting] = useState(false)
  const [mlBanner, setMlBanner] = useState<{ ok: boolean; text: string } | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    if (params.get('ml_connected')) return { ok: true, text: 'Mercado Livre conectado com sucesso!' }
    if (params.get('ml_error')) return { ok: false, text: `Erro ao conectar: ${params.get('ml_error')}` }
    return null
  })

  const handleMlConnect = async () => {
    setMlConnecting(true)
    try {
      const res = await fetch(`/api/admin/clients/${id}/ml-connect`, { method: 'POST' })
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
      else alert(data.error ?? 'Erro ao gerar URL de conexão')
    } finally {
      setMlConnecting(false)
    }
  }

  // ── WhatsApp notifications state ────────────────────────────────────────────
  const [notifConfig, setNotifConfig] = useState<any>(null)
  const [notifLogs, setNotifLogs]     = useState<any[]>([])
  const [notifForm, setNotifForm]     = useState({
    phoneNumber: '', apiUrl: '', apiKey: '', apiInstance: '',
    notifyOnSale: true, notifyOnFeedback: true, notifyOnQuestion: false,
    minSaleValue: '0', active: true,
  })
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifMsg, setNotifMsg]       = useState<{ ok: boolean; text: string } | null>(null)
  const [testingSend, setTestingSend] = useState(false)
  const [showApiFields, setShowApiFields] = useState(false)

  const fetchNotifications = async () => {
    const res  = await fetch(`/api/notifications/${id}`)
    const data = await res.json()
    if (data.config) {
      setNotifConfig(data.config)
      setNotifForm({
        phoneNumber:      data.config.phoneNumber      ?? '',
        apiUrl:           data.config.apiUrl           ?? '',
        apiKey:           data.config.apiKey           ?? '',
        apiInstance:      data.config.apiInstance      ?? '',
        notifyOnSale:     data.config.notifyOnSale     ?? true,
        notifyOnFeedback: data.config.notifyOnFeedback ?? true,
        notifyOnQuestion: data.config.notifyOnQuestion ?? false,
        minSaleValue:     String(data.config.minSaleValue ?? 0),
        active:           data.config.active           ?? true,
      })
    }
    setNotifLogs(data.logs ?? [])
  }

  const saveNotifConfig = async () => {
    setNotifSaving(true)
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...notifForm, minSaleValue: Number(notifForm.minSaleValue) }),
    })
    setNotifSaving(false)
    setNotifMsg({ ok: res.ok, text: res.ok ? 'Configuração salva!' : 'Erro ao salvar.' })
    if (res.ok) { fetchNotifications(); setTimeout(() => setNotifMsg(null), 3000) }
  }

  const sendTestNotification = async () => {
    setTestingSend(true)
    const res  = await fetch(`/api/notifications/${id}`, { method: 'POST' })
    const data = await res.json()
    setTestingSend(false)
    setNotifMsg({
      ok:   data.ok,
      text: data.ok ? 'Mensagem de teste enviada!' : `Falha: ${data.error ?? 'erro desconhecido'}`,
    })
    fetchNotifications()
    setTimeout(() => setNotifMsg(null), 5000)
  }

  // load notifications when tab opens
  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'notificacoes') fetchNotifications()
  }

  const [inviteModal, setInviteModal] = useState<{ mp: string; url: string; expiresAt: string } | null>(null)
  const [generatingInvite, setGeneratingInvite] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const generateInvite = async (mp: string) => {
    setGeneratingInvite(p => ({ ...p, [mp]: true }))
    const res = await fetch(`/api/admin/clients/${id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketplace: mp }),
    })
    setGeneratingInvite(p => ({ ...p, [mp]: false }))
    if (res.ok) {
      const data = await res.json()
      const url = `${window.location.origin}/conectar/${data.token}`
      setInviteModal({ mp, url, expiresAt: data.expiresAt })
    }
  }

  const copyInviteLink = () => {
    if (!inviteModal) return
    navigator.clipboard.writeText(inviteModal.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchClient = async () => {
    const res = await fetch(`/api/admin/clients/${id}`)
    const data = await res.json()
    setClient(data)
    setLoading(false)
    const initial: Record<string, Record<string, string>> = {}
    for (const acc of data.marketplaceAccounts ?? []) {
      initial[acc.marketplace] = {
        accountName: acc.accountName ?? '',
        sellerId: acc.sellerId ?? '',
        appId: acc.appId ?? '',
        appSecret: acc.appSecret ?? '',
        accessToken: acc.accessToken ?? '',
        refreshToken: acc.refreshToken ?? '',
        status: acc.status ?? 'active',
      }
    }
    setMpForms(initial)
  }

  useEffect(() => { fetchClient() }, [id])

  const getMpForm = (mp: string) =>
    mpForms[mp] ?? { accountName: '', sellerId: '', appId: '', appSecret: '', accessToken: '', refreshToken: '', status: 'active' }

  const setMpField = (mp: string, key: string, value: string) =>
    setMpForms(prev => ({ ...prev, [mp]: { ...getMpForm(mp), [key]: value } }))

  const saveMp = async (mp: string) => {
    setMpSaving(p => ({ ...p, [mp]: true }))
    const res = await fetch(`/api/admin/clients/${id}/marketplace`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketplace: mp, ...getMpForm(mp) }),
    })
    setMpSaving(p => ({ ...p, [mp]: false }))
    setMpMsg(p => ({ ...p, [mp]: { ok: res.ok, text: res.ok ? 'Salvo com sucesso!' : 'Erro ao salvar.' } }))
    if (res.ok) { fetchClient(); setTimeout(() => setMpMsg(p => ({ ...p, [mp]: { ok: true, text: '' } })), 3000) }
  }

  const deleteMp = async (mp: string) => {
    if (!confirm(`Remover integração com ${MP_CONFIG[mp]?.label ?? mp}?`)) return
    await fetch(`/api/admin/clients/${id}/marketplace?marketplace=${mp}`, { method: 'DELETE' })
    fetchClient()
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    await fetch(`/api/admin/clients/${id}/documents`, { method: 'POST', body: form })
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    fetchClient()
  }

  const deleteDoc = async (docId: string, name: string) => {
    if (!confirm(`Remover arquivo "${name}"?`)) return
    await fetch(`/api/admin/clients/${id}/documents?docId=${docId}`, { method: 'DELETE' })
    fetchClient()
  }

  if (loading) return (
    <div className="flex flex-col flex-1 bg-background">
      <Header title="Carregando..." subtitle="" />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  )

  if (!client) return (
    <div className="flex flex-col flex-1 bg-background">
      <Header title="Cliente não encontrado" subtitle="" />
    </div>
  )

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'geral',         label: 'Visão Geral',    icon: Building2 },
    { key: 'marketplace',   label: 'Conexões',        icon: Zap,           badge: client.marketplaceAccounts?.length },
    { key: 'anuncios',      label: 'Anúncios',        icon: Megaphone },
    { key: 'documentos',    label: 'Documentos',      icon: FileText,      badge: client.documents?.length || undefined },
    { key: 'notificacoes',  label: 'Notificações',    icon: Bell },
  ]

  return (
    <div className="flex flex-col flex-1 bg-background">
      <Header
        title={client.name}
        subtitle={`/${client.slug}`}
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/clientes')}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* ML OAuth banner */}
        {mlBanner && (
          <div className={cn(
            'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium',
            mlBanner.ok
              ? 'border-green-500/30 bg-green-500/10 text-green-600'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          )}>
            <span className="flex items-center gap-2">
              {mlBanner.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {mlBanner.text}
            </span>
            <button onClick={() => setMlBanner(null)} className="opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary leading-none">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── GERAL ── */}
        {tab === 'geral' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Cliente desde</p><p className="text-sm font-semibold">{formatDate(client.createdAt)}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-muted-foreground">Usuários</p><p className="text-sm font-semibold">{client.users?.length ?? 0}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100"><ShoppingBag className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-xs text-muted-foreground">Conexões ativas</p><p className="text-sm font-semibold">{client.marketplaceAccounts?.filter((a: any) => a.status === 'active').length ?? 0}</p></div>
            </CardContent></Card>

            {client.users?.length > 0 && (
              <Card className="md:col-span-3">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Usuários vinculados</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {client.users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {u.name?.charAt(0) ?? u.email?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── CONEXÕES (simplified) ── */}
        {tab === 'marketplace' && (
          <div className="space-y-4">
            {Object.entries(MP_CONFIG).map(([mp, cfg]) => {
              const existing = client.marketplaceAccounts?.find((a: any) => a.marketplace === mp)
              const form = getMpForm(mp)
              const msg = mpMsg[mp]
              const isConnected = existing && existing.accessToken
              const advOpen = showAdvanced[mp] ?? false

              return (
                <Card key={mp} className={cn('border transition-shadow hover:shadow-sm', isConnected ? cfg.border : 'border-border')}>
                  {/* Header */}
                  <div className={cn('flex items-center justify-between px-5 py-4 rounded-t-xl', isConnected ? cfg.bg : 'bg-muted/30')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', isConnected ? cfg.accentBg : 'bg-muted')}>
                        <Zap className={cn('h-4 w-4', isConnected ? cfg.color : 'text-muted-foreground')} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-semibold', isConnected ? cfg.color : 'text-foreground')}>{cfg.label}</p>
                        {isConnected ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] text-green-600 font-medium">Conectado · {form.accountName || existing?.accountName}</span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Não conectado</p>
                        )}
                      </div>
                    </div>
                    {existing && (
                      <button onClick={() => deleteMp(mp)} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remover conexão">
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields */}
                  <CardContent className="pt-4 pb-4 space-y-4">

                    {/* ML OAuth flow — simplified 2-step UI */}
                    {mp === 'MERCADOLIVRE' ? (
                      <>
                        {/* Step 1 — App credentials */}
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                            Passo 1 — Credenciais do App
                            <a href="https://developers.mercadolivre.com.br" target="_blank" rel="noopener noreferrer" className="ml-2 normal-case font-normal text-primary hover:underline">
                              Onde encontrar →
                            </a>
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                App ID <span className="text-[10px] opacity-60">(Client ID do seu app ML)</span>
                              </label>
                              <Input value={form.appId ?? ''} onChange={e => setMpField(mp, 'appId', e.target.value)}
                                placeholder="Ex: 6521451414089730" className="text-xs font-mono" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                App Secret <span className="text-[10px] opacity-60">(Client Secret — NÃO é o Seller ID)</span>
                              </label>
                              <div className="relative">
                                <Input
                                  type={showSecret[`${mp}_appSecret`] ? 'text' : 'password'}
                                  value={form.appSecret ?? ''}
                                  onChange={e => setMpField(mp, 'appSecret', e.target.value)}
                                  placeholder="Hash longo gerado no portal ML"
                                  className="text-xs pr-8 font-mono"
                                />
                                <button type="button" onClick={() => setShowSecret(p => ({ ...p, [`${mp}_appSecret`]: !p[`${mp}_appSecret`] }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                  {showSecret[`${mp}_appSecret`] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" className="mt-3" onClick={() => saveMp(mp)} disabled={mpSaving[mp]}>
                            {mpSaving[mp] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Salvar credenciais
                          </Button>
                        </div>

                        {/* Step 2 — OAuth authorization */}
                        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-400/80 mb-1">
                            Passo 2 — Autorizar acesso
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {isConnected
                              ? 'Conta autorizada. Clique para reautorizar se necessário.'
                              : 'Salve as credenciais acima e clique para conectar a conta do vendedor.'}
                          </p>
                          <button
                            type="button"
                            onClick={handleMlConnect}
                            disabled={mlConnecting || !form.appId || !form.appSecret}
                            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black hover:bg-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {mlConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                            {mlConnecting ? 'Aguarde...' : isConnected ? '🔄 Reautorizar com Mercado Livre' : '🔗 Autorizar com Mercado Livre'}
                          </button>
                          {isConnected && (
                            <p className="mt-2 text-[11px] text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Seller ID: {existing?.sellerId} · Token ativo
                            </p>
                          )}
                        </div>

                        {/* Nome da conta (optional) */}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome da conta <span className="text-[10px] opacity-60">(opcional)</span></label>
                          <Input value={form.accountName ?? ''} onChange={e => setMpField(mp, 'accountName', e.target.value)}
                            placeholder="Ex: Passo Compasso" className="text-xs max-w-xs" />
                        </div>
                      </>
                    ) : (
                      /* Other marketplaces — original form */
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {cfg.basic.map(field => (
                            <div key={field.key}>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</label>
                              <div className="relative">
                                <Input
                                  type={field.secret && !showSecret[`${mp}_${field.key}`] ? 'password' : 'text'}
                                  value={form[field.key as keyof typeof form] ?? ''}
                                  onChange={e => setMpField(mp, field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="text-xs pr-8"
                                />
                                {field.secret && (
                                  <button type="button" onClick={() => setShowSecret(p => ({ ...p, [`${mp}_${field.key}`]: !p[`${mp}_${field.key}`] }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showSecret[`${mp}_${field.key}`] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Button size="sm" onClick={() => saveMp(mp)} disabled={mpSaving[mp]}>
                            {mpSaving[mp] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            {isConnected ? 'Salvar alterações' : 'Conectar'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => generateInvite(mp)} disabled={generatingInvite[mp]}>
                            {generatingInvite[mp] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                            Gerar link de acesso
                          </Button>
                        </div>
                      </>
                    )}

                    {msg?.text && (
                      <span className={cn('flex items-center gap-1 text-xs font-medium', msg.ok ? 'text-green-600' : 'text-destructive')}>
                        {msg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {msg.text}
                      </span>
                    )}
                    {mp !== 'MERCADOLIVRE' && (
                      <a href={cfg.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors w-fit">
                        <ExternalLink className="h-3 w-3" /> Docs da API
                      </a>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* ── ANÚNCIOS ── */}
        {tab === 'anuncios' && adsMock && (() => {
          const allCampaigns = [
            ...adsMock.mlCampaigns.map(c => ({ ...c, mp: 'MERCADOLIVRE' })),
            ...adsMock.shopeeCampaigns.map(c => ({ ...c, mp: 'SHOPEE' })),
          ]
          const filtered = adsFilter === 'all' ? allCampaigns
            : allCampaigns.filter(c => c.mp === adsFilter)

          const mpSummaries = MARKETPLACE_LIST.slice(0, 2).map(mpDef => ({
            mpKey: mpDef.keyUpper,
            def: mpDef,
            summary: adsSummary(mpDef.key === 'mercadolivre' ? adsMock.mlCampaigns : adsMock.shopeeCampaigns),
          }))

          const visibleChartMPs = MARKETPLACE_LIST.filter(mp =>
            adsFilter === 'all' || mp.keyUpper === adsFilter
          )

          return (
            <div className="space-y-5">
              {/* Period + filter */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-muted-foreground font-medium">Últimos 30 dias</p>
                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-0.5">
                  <button onClick={() => setAdsFilter('all')}
                    className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors',
                      adsFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}>Todos</button>
                  {MARKETPLACE_LIST.map(mp => (
                    <button key={mp.keyUpper} onClick={() => setAdsFilter(mp.keyUpper)}
                      className={cn('rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        adsFilter === mp.keyUpper ? 'bg-primary text-primary-foreground shadow-sm'
                          : cn('text-muted-foreground hover:text-foreground', mp.tailwind.text)
                      )}>{mp.label}</button>
                  ))}
                </div>
              </div>

              {/* KPI summaries per marketplace */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {mpSummaries.filter(m => adsFilter === 'all' || adsFilter === m.mpKey).map(m => (
                  <Card key={m.mpKey} className={cn('border', m.def.tailwind.border)}>
                    <CardHeader className={cn('pb-3 rounded-t-xl', m.def.tailwind.bg)}>
                      <CardTitle className={cn('text-sm flex items-center gap-2', m.def.tailwind.text)}>
                        <span>{m.def.connect.logo}</span> {m.def.label} Ads
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold">{formatLargeNum(m.summary.impressions)}</p>
                          <p className="text-[10px] text-muted-foreground">Impressões</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{formatLargeNum(m.summary.clicks)}</p>
                          <p className="text-[10px] text-muted-foreground">Cliques</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{m.summary.ctr}%</p>
                          <p className="text-[10px] text-muted-foreground">CTR</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{m.summary.roas}x</p>
                          <p className="text-[10px] text-muted-foreground">ROAS</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Gasto total</span>
                        <span className="font-semibold text-foreground">{formatCurrency(m.summary.spend)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">CPC médio</span>
                        <span className="font-medium">R$ {m.summary.cpc}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Conversões</span>
                        <span className="font-medium">{m.summary.conversions}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Spend chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" /> Investimento diário em Ads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={adsMock.days} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="label"
                        ticks={adsMock.days.filter((_, i) => i % 5 === 0).map(d => d.label)}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tickFormatter={v => `R$${v}`}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false} tickLine={false} width={44}
                      />
                      <Tooltip content={<AdsTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={v => MARKETPLACE_LIST.find(m => m.key === v)?.label ?? v} />
                      {visibleChartMPs.map(mp => (
                        <Line key={mp.key} type="monotone" dataKey={mp.key} name={mp.key} stroke={mp.chartColor} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Campaigns table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Campanhas ({filtered.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {['Campanha', 'Marketplace', 'Tipo', 'Status', 'Impressões', 'Cliques', 'CTR', 'Gasto', 'ROAS'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c, i) => {
                          const clicks = c.clicks
                          const ctr = ((clicks / c.impressions) * 100).toFixed(1)
                          const roas = (((c.conversions * 180) / c.spend)).toFixed(1)
                          const mpDef = getMPByUpper(c.mp)
                          return (
                            <tr key={i} className={cn('border-b border-border/50 hover:bg-muted/20 transition-colors', i % 2 === 1 && 'bg-muted/10')}>
                              <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{c.name}</td>
                              <td className="px-4 py-3">
                                <span className={cn('font-semibold text-[11px]', mpDef.tailwind.text)}>{mpDef.label}</span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{c.type}</td>
                              <td className="px-4 py-3">
                                <span className={cn('rounded-full px-2 py-0.5 font-semibold text-[10px]',
                                  c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                )}>
                                  {c.status === 'active' ? 'Ativa' : 'Pausada'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{formatLargeNum(c.impressions)}</td>
                              <td className="px-4 py-3 text-muted-foreground">{formatLargeNum(clicks)}</td>
                              <td className="px-4 py-3 text-muted-foreground">{ctr}%</td>
                              <td className="px-4 py-3 font-medium">{formatCurrency(c.spend)}</td>
                              <td className="px-4 py-3">
                                <span className={cn('font-semibold', Number(roas) >= 3 ? 'text-green-600' : Number(roas) >= 1.5 ? 'text-yellow-600' : 'text-red-500')}>
                                  {roas}x
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}

        {/* ── DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <label className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer',
                  uploading ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent'
                )}>
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                  <span className="text-sm font-medium">{uploading ? 'Enviando...' : 'Clique para enviar um arquivo'}</span>
                  <span className="text-xs text-muted-foreground">PDF, imagens, planilhas, contratos</span>
                  <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} disabled={uploading} />
                </label>
              </CardContent>
            </Card>

            {(!client.documents || client.documents.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum documento anexado ainda</p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {client.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between px-4 py-3 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {doc.fileSize ? formatFileSize(doc.fileSize) : ''}
                              {doc.fileSize && doc.uploadedBy ? ' · ' : ''}
                              {doc.uploadedBy ? `Por ${doc.uploadedBy}` : ''}{' · '}
                              {formatDateTime(doc.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button onClick={() => deleteDoc(doc.id, doc.name)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {/* ── NOTIFICAÇÕES ── */}
        {tab === 'notificacoes' && (
          <div className="space-y-4">

            {/* Info banner */}
            <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 flex items-start gap-3">
              <MessageCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary">Notificações via WhatsApp</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  O lojista receberá mensagens automáticas ao ocorrer novas vendas ou avaliações. Utiliza a Evolution API (compatível com instâncias próprias ou cloud).
                </p>
              </div>
            </div>

            {/* Config card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Configuração
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Ativo</span>
                    <button onClick={() => setNotifForm(f => ({ ...f, active: !f.active }))} className="text-primary">
                      {notifForm.active
                        ? <ToggleRight className="h-5 w-5 text-green-600" />
                        : <ToggleLeft  className="h-5 w-5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone number */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Número WhatsApp do lojista <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={notifForm.phoneNumber}
                    onChange={e => setNotifForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="5511999999999 (com código do país)"
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Formato: código do país + DDD + número (ex: 5511912345678)</p>
                </div>

                {/* Event toggles */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Notificar em:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'notifyOnSale',     label: '🛒 Nova venda',     field: 'notifyOnSale'     as const },
                      { key: 'notifyOnFeedback', label: '⭐ Nova avaliação', field: 'notifyOnFeedback' as const },
                      { key: 'notifyOnQuestion', label: '❓ Nova pergunta',  field: 'notifyOnQuestion' as const },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setNotifForm(f => ({ ...f, [opt.field]: !f[opt.field] }))}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                          notifForm[opt.field]
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-accent'
                        )}
                      >
                        {notifForm[opt.field]
                          ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          : <div className="h-3.5 w-3.5 rounded-full border border-current shrink-0" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min sale value */}
                {notifForm.notifyOnSale && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Valor mínimo de venda:</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number" min="0" step="10"
                        value={notifForm.minSaleValue}
                        onChange={e => setNotifForm(f => ({ ...f, minSaleValue: e.target.value }))}
                        className="text-xs w-28"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">0 = notifica todas as vendas</p>
                  </div>
                )}

                {/* Advanced API toggle */}
                <button
                  onClick={() => setShowApiFields(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showApiFields && 'rotate-180')} />
                  {showApiFields ? 'Ocultar' : 'Configurar'} Evolution API
                </button>

                {showApiFields && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border border-border bg-muted/20 p-3">
                    {[
                      { key: 'apiUrl',      label: 'URL da API',    placeholder: 'https://api.seudominio.com' },
                      { key: 'apiInstance', label: 'Instância',     placeholder: 'nome-da-instancia' },
                      { key: 'apiKey',      label: 'API Key',       placeholder: 'sua-chave-secreta' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                        <Input
                          value={(notifForm as any)[f.key]}
                          onChange={e => setNotifForm(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="text-xs bg-background"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <Button size="sm" onClick={saveNotifConfig} disabled={notifSaving}>
                    {notifSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Salvar configuração
                  </Button>
                  <Button size="sm" variant="outline" onClick={sendTestNotification} disabled={testingSend || !notifForm.phoneNumber}>
                    {testingSend ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Enviar teste
                  </Button>
                  {notifMsg && (
                    <span className={cn('flex items-center gap-1 text-xs font-medium', notifMsg.ok ? 'text-green-600' : 'text-destructive')}>
                      {notifMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      {notifMsg.text}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notification log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Histórico de envios
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {notifLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum envio registrado ainda</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start justify-between px-4 py-3 gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0', log.status === 'sent' ? 'bg-green-500' : 'bg-destructive')} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                log.type === 'test'     ? 'bg-muted text-muted-foreground' :
                                log.type === 'sale'     ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                log.type === 'feedback' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                'bg-primary/10 text-primary'
                              )}>
                                {{ test: 'Teste', sale: 'Venda', feedback: 'Avaliação', question: 'Pergunta' }[log.type as 'test' | 'sale' | 'feedback' | 'question'] ?? log.type}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">{log.phoneNumber}</span>
                            </div>
                            {log.error && <p className="text-[10px] text-destructive mt-0.5">{log.error}</p>}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{new Date(log.sentAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* ── Invite modal ── */}
      {inviteModal && (() => {
        const mpCfg = MP_CONFIG[inviteModal.mp]
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setInviteModal(null)}>
            <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Modal header */}
              <div className={cn('flex items-center justify-between px-5 py-4', mpCfg.bg)}>
                <div className="flex items-center gap-2.5">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', mpCfg.accentBg)}>
                    <Smartphone className={cn('h-4 w-4', mpCfg.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Link de conexão gerado</p>
                    <p className={cn('text-[11px] font-medium', mpCfg.color)}>{mpCfg.label}</p>
                  </div>
                </div>
                <button onClick={() => setInviteModal(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/10 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* URL display */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Link para o lojista</p>
                  <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5', mpCfg.border, mpCfg.bg)}>
                    <Link2 className={cn('h-3.5 w-3.5 shrink-0', mpCfg.color)} />
                    <p className="flex-1 text-xs font-mono text-foreground truncate">{inviteModal.url}</p>
                    <button
                      onClick={copyInviteLink}
                      className={cn('shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1',
                        copied ? 'bg-green-100 text-green-700' : 'bg-white/80 text-foreground hover:bg-white border border-border'
                      )}
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* How-to hint */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" /> Como usar
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Envie este link para o lojista via WhatsApp ou e-mail. Ao abrir, ele preenche apenas os dados básicos da loja sem precisar acessar o sistema.
                  </p>
                </div>

                {/* Expiry */}
                <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>Link válido por 7 dias · expira em <strong className="text-foreground">{formatDate(inviteModal.expiresAt)}</strong></span>
                </div>

                {/* CTA */}
                <Button className="w-full" onClick={copyInviteLink}>
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Link copiado!' : 'Copiar link'}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
