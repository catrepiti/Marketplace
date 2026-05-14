import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrders } from '@/lib/mock/store'
import { AdCampaign, AdsMetrics } from '@/lib/types'
import { MARKETPLACE_KEYS, MARKETPLACES } from '@/lib/marketplaces'

export const dynamic = 'force-dynamic'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// Simple string → number hash for deterministic per-client scaling
function strHash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function generateCampaigns(): AdCampaign[] {
  const templates: { marketplace: string; name: string; type: string; status: AdCampaign['status'] }[] = [
    // Mercado Livre
    { marketplace: 'MERCADOLIVRE', name: 'Fones Bluetooth Premium – Produto',   type: 'Produto',    status: 'active'  },
    { marketplace: 'MERCADOLIVRE', name: 'Teclados Gamer RGB – Categoria',       type: 'Categoria',  status: 'active'  },
    { marketplace: 'MERCADOLIVRE', name: 'Mouse Logitech MX Master – Produto',   type: 'Produto',    status: 'paused'  },
    { marketplace: 'MERCADOLIVRE', name: 'Periféricos Gamer – Brand',            type: 'Brand',      status: 'active'  },
    { marketplace: 'MERCADOLIVRE', name: 'SSD 1TB NVMe – Destaque',              type: 'Destaque',   status: 'active'  },
    { marketplace: 'MERCADOLIVRE', name: 'Monitor 27" 144Hz – Produto',          type: 'Produto',    status: 'ended'   },
    // Shopee
    { marketplace: 'SHOPEE', name: 'Smartwatch Ultra Series – Flash Sale',    type: 'Flash Sale', status: 'active'  },
    { marketplace: 'SHOPEE', name: 'Skincare Coreano – Discovery Ads',        type: 'Discovery',  status: 'active'  },
    { marketplace: 'SHOPEE', name: 'Tênis Running Pro – Search Ads',          type: 'Search',     status: 'active'  },
    { marketplace: 'SHOPEE', name: 'Mochilas Impermeáveis – Produto',         type: 'Produto',    status: 'paused'  },
    { marketplace: 'SHOPEE', name: 'Fone TWS Sem Fio – Flash Sale',           type: 'Flash Sale', status: 'active'  },
    { marketplace: 'SHOPEE', name: 'Suplementos Fitness – Discovery',         type: 'Discovery',  status: 'ended'   },
    // Amazon
    { marketplace: 'AMAZON', name: 'Echo Dot Promoção – Sponsored Products',  type: 'Sponsored',  status: 'active'  },
    { marketplace: 'AMAZON', name: 'Kindle Paperwhite – Sponsored Brands',    type: 'Sponsored',  status: 'active'  },
    { marketplace: 'AMAZON', name: 'Acessórios Tech – Sponsored Display',     type: 'Display',    status: 'paused'  },
    { marketplace: 'AMAZON', name: 'Headphones Premium – Sponsored Products', type: 'Sponsored',  status: 'active'  },
    { marketplace: 'AMAZON', name: 'Câmeras e Webcams – Brand Store',         type: 'Brand',      status: 'active'  },
    // Magalu
    { marketplace: 'MAGALU', name: 'TV 4K LG – Produto em Destaque',          type: 'Destaque',   status: 'active'  },
    { marketplace: 'MAGALU', name: 'Eletrodomésticos Casa – Categoria',        type: 'Categoria',  status: 'active'  },
    { marketplace: 'MAGALU', name: 'Air Fryer Premium – Produto',              type: 'Produto',    status: 'paused'  },
    { marketplace: 'MAGALU', name: 'Geladeiras e Freezers – Search',           type: 'Search',     status: 'active'  },
    // Americanas
    { marketplace: 'AMERICANAS', name: 'Moda Feminina Outono – Destaque',       type: 'Destaque',   status: 'active'  },
    { marketplace: 'AMERICANAS', name: 'Perfumes Importados – Patrocinado',     type: 'Patrocinado',status: 'active'  },
    { marketplace: 'AMERICANAS', name: 'Calçados Esportivos – Categoria',       type: 'Categoria',  status: 'ended'   },
    // Casas Bahia
    { marketplace: 'CASASBABIA', name: 'Sofás e Poltronas – Destaque',          type: 'Destaque',   status: 'active'  },
    { marketplace: 'CASASBABIA', name: 'Colchões e Camas – Patrocinado',        type: 'Patrocinado',status: 'active'  },
    { marketplace: 'CASASBABIA', name: 'Móveis de Escritório – Categoria',      type: 'Categoria',  status: 'paused'  },
  ]

  return templates.map((c, i) => {
    const rand = seeded(i * 31 + 7)
    const impressions   = Math.round(8000 + rand() * 70000)
    const ctr           = 0.02 + rand() * 0.05
    const clicks        = Math.round(impressions * ctr)
    const cpc           = 0.3 + rand() * 1.5
    const spend         = +(clicks * cpc).toFixed(2)
    const convRate      = 0.02 + rand() * 0.06
    const conversions   = Math.round(clicks * convRate)
    const avgOrderValue = 100 + rand() * 400
    const revenue       = +(conversions * avgOrderValue).toFixed(2)
    const daysAgo       = Math.round(5 + rand() * 55)
    const startDate     = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0]
    return { ...c, id: `camp-${i}`, impressions, clicks, spend, conversions, revenue, startDate }
  })
}

function buildMetrics(campaigns: AdCampaign[], periodDays: number, mpFilter?: string): AdsMetrics {
  const rand = seeded(periodDays * 13)

  // ── Scale campaign metrics to the selected period (base = 30 days) ──────────
  // Each campaign's values are proportionally adjusted so that switching from
  // 30 → 7 days reduces spend/clicks/etc., and 30 → 90 days increases them.
  // Seeded noise per campaign avoids a perfectly mechanical linear scaling.
  const periodScale = periodDays / 30
  const scaledCampaigns: AdCampaign[] = campaigns.map((c, i) => {
    const r = seeded(periodDays * 7 + i * 31)
    const noise = 0.82 + r() * 0.36          // ±18% organic noise
    const s = periodScale * noise
    return {
      ...c,
      impressions:  Math.round(c.impressions  * s),
      clicks:       Math.round(c.clicks       * s),
      spend:        +(c.spend       * s).toFixed(2),
      conversions:  Math.round(c.conversions  * s),
      revenue:      +(c.revenue     * s).toFixed(2),
    }
  })

  const filtered = mpFilter
    ? scaledCampaigns.filter(c => c.marketplace === mpFilter)
    : scaledCampaigns

  const orders = getOrders()

  // Per-marketplace total sales revenue for TACOS denominator — also period-scaled
  const mpSalesMap: Record<string, number> = {}
  for (const mp of MARKETPLACE_KEYS) {
    const rawSales = orders
      .filter(o => o.marketplace === mp)
      .reduce((s, o) => s + o.totalPrice, 0)
    mpSalesMap[mp.toUpperCase()] = +(rawSales * periodScale).toFixed(2)
  }
  const allTotalSales = Object.values(mpSalesMap).reduce((s, v) => s + v, 0)

  const totalSpend       = +filtered.reduce((s, c) => s + c.spend,       0).toFixed(2)
  const totalImpressions =  filtered.reduce((s, c) => s + c.impressions,  0)
  const totalClicks      =  filtered.reduce((s, c) => s + c.clicks,       0)
  const totalConversions =  filtered.reduce((s, c) => s + c.conversions,  0)
  const totalRevenue     = +filtered.reduce((s, c) => s + c.revenue,      0).toFixed(2)

  const totalSalesRevenue = mpFilter ? (mpSalesMap[mpFilter] ?? 0) : allTotalSales

  const ctr   = totalImpressions > 0 ? +((totalClicks / totalImpressions) * 100).toFixed(2) : 0
  const cpc   = totalClicks > 0      ? +(totalSpend   / totalClicks).toFixed(2)              : 0
  const roas  = totalSpend > 0       ? +(totalRevenue / totalSpend).toFixed(2)               : 0
  const acos  = totalRevenue > 0     ? +((totalSpend / totalRevenue) * 100).toFixed(2)       : 0
  const tacos = totalSalesRevenue > 0 ? +((totalSpend / totalSalesRevenue) * 100).toFixed(2) : 0

  const prevFactor = 0.80 + rand() * 0.15
  const prevPeriod = {
    totalSpend:       +(totalSpend        * prevFactor).toFixed(2),
    totalClicks:      Math.round(totalClicks * prevFactor),
    totalConversions: Math.round(totalConversions * prevFactor),
    roas:             +(roas  * (0.9 + rand() * 0.2)).toFixed(2),
    acos:             +(acos  * (1.0 + rand() * 0.2)).toFixed(2),
    tacos:            +(tacos * (1.0 + rand() * 0.2)).toFixed(2),
  }

  // Per-marketplace breakdown — always uses the full scaled set (not mpFilter-filtered)
  // so side cards remain visible even when a single platform is selected in the UI
  const mpKeys = mpFilter
    ? [mpFilter]
    : Array.from(new Set(scaledCampaigns.map(c => c.marketplace)))

  const byMarketplace = mpKeys.map(mp => {
    const mpC         = scaledCampaigns.filter(c => c.marketplace === mp)
    const spend       = +mpC.reduce((s, c) => s + c.spend,       0).toFixed(2)
    const impressions =  mpC.reduce((s, c) => s + c.impressions,  0)
    const clicks      =  mpC.reduce((s, c) => s + c.clicks,       0)
    const conversions =  mpC.reduce((s, c) => s + c.conversions,  0)
    const revenue     = +mpC.reduce((s, c) => s + c.revenue,      0).toFixed(2)
    const mpSales     = mpSalesMap[mp] ?? 0
    return {
      marketplace: mp,
      spend, impressions, clicks, conversions, revenue,
      totalRevenue: mpSales,
      ctr:   impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
      cpc:   clicks > 0      ? +(spend / clicks).toFixed(2)               : 0,
      roas:  spend > 0       ? +(revenue / spend).toFixed(2)              : 0,
      acos:  revenue > 0     ? +((spend / revenue) * 100).toFixed(2)      : 0,
      tacos: mpSales > 0     ? +((spend / mpSales) * 100).toFixed(2)      : 0,
    }
  })

  // Daily spend chart — one key per marketplace
  const days = Math.min(periodDays, 90)
  const dayBase = totalSpend / days

  const spendByDay = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const date  = d.toISOString().split('T')[0]
    const label = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d)
    const base  = dayBase * (0.6 + rand() * 0.8)

    const dayVals: Record<string, number> = {}
    let dayTotal = 0
    for (const mp of mpKeys) {
      const bd = byMarketplace.find(b => b.marketplace === mp)
      const share = bd && totalSpend > 0 ? bd.spend / totalSpend : 1 / mpKeys.length
      const v = mpFilter && mpFilter !== mp ? 0 : +(base * share * (0.8 + rand() * 0.4)).toFixed(2)
      dayVals[mp.toLowerCase()] = v
      dayTotal += v
    }
    return { date, label, ...dayVals, total: +dayTotal.toFixed(2) }
  })

  return {
    totalSpend, totalImpressions, totalClicks, totalConversions,
    totalRevenue, totalSalesRevenue,
    ctr, cpc, roas, acos, tacos,
    prevPeriod, byMarketplace, spendByDay,
    campaigns: filtered,   // period-scaled + platform-filtered campaigns for the accordion
  }
}

const ALL_CAMPAIGNS = generateCampaigns()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const hasData = await prisma.marketplaceAccount.count({ where: { accessToken: { not: null } } }) > 0
  if (!hasData) {
    const emptyMetrics = {
      totalSpend: 0, totalImpressions: 0, totalClicks: 0,
      totalConversions: 0, totalRevenue: 0, totalSalesRevenue: 0,
      ctr: 0, cpc: 0, roas: 0, acos: 0, tacos: 0,
      prevPeriod: { totalSpend: 0, totalClicks: 0, totalConversions: 0, roas: 0, acos: 0, tacos: 0 },
      byMarketplace: [],
      spendByDay: [],
      campaigns: [],
    }
    return NextResponse.json(emptyMetrics)
  }

  const { searchParams } = new URL(request.url)
  const period      = parseInt(searchParams.get('period') ?? '30')
  const marketplace = searchParams.get('marketplace') ?? undefined
  const clientId    = searchParams.get('clientId') ?? undefined

  // ── Per-client mode ────────────────────────────────────────────────────────
  if (clientId) {
    const dbClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, marketplaceAccounts: { select: { marketplace: true } } },
    })
    if (!dbClient) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const activeMPs = new Set(dbClient.marketplaceAccounts.map(a => a.marketplace.toUpperCase()))
    const hash = strHash(clientId)

    // Filter campaigns to only this client's active marketplaces, then scale deterministically
    const clientCampaigns: AdCampaign[] = ALL_CAMPAIGNS
      .filter(c => activeMPs.has(c.marketplace))
      .map((c, i) => {
        const r = seeded(hash + i * 17)
        const scale = 0.25 + r() * 1.5          // 0.25× to 1.75× per campaign
        return {
          ...c,
          id: `${clientId.slice(-6)}-${c.id}`,
          impressions:  Math.round(c.impressions  * scale),
          clicks:       Math.round(c.clicks       * scale),
          spend:        +(c.spend       * scale).toFixed(2),
          conversions:  Math.round(c.conversions  * scale),
          revenue:      +(c.revenue     * scale).toFixed(2),
        }
      })

    const metrics = buildMetrics(clientCampaigns, period, marketplace)
    return NextResponse.json(metrics)
  }

  // ── Consolidated mode ──────────────────────────────────────────────────────
  const metrics = buildMetrics(ALL_CAMPAIGNS, period, marketplace || undefined)
  return NextResponse.json(metrics)
}
