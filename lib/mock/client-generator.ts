/**
 * Deterministic per-client mock data.
 * Uses the client's database ID as a seed so data is stable across requests.
 */
import { MARKETPLACE_KEYS, MARKETPLACES, MarketplaceKey } from '@/lib/marketplaces'

// ── Seeded PRNG (LCG) ─────────────────────────────────────────────────────────
function makePrng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}

function strSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ClientMarketplaceStat {
  marketplace: MarketplaceKey
  revenue: number
  orders: number
  products: number
  adSpend: number
  roas: number
  avgRating: number
}

export interface ClientOverview {
  id: string
  name: string
  slug: string
  gmv: number
  orders: number
  products: number
  adSpend: number
  roas: number
  avgRating: number
  avgTicket: number
  cancelRate: number
  trend: number           // % vs previous period
  adTrend: number
  activeMarketplaces: MarketplaceKey[]
  topMarketplace: MarketplaceKey
  byMarketplace: ClientMarketplaceStat[]
  revenueByDay: { date: string; revenue: number }[]
  topProducts: { name: string; revenue: number; marketplace: MarketplaceKey }[]
}

// ── Product pools per client archetype ────────────────────────────────────────
const PRODUCT_POOLS: Record<string, { name: string; price: number }[]> = {
  tech: [
    { name: 'Notebook Ultrabook 15"', price: 3299 },
    { name: 'Monitor 27" 4K IPS',     price: 1899 },
    { name: 'Teclado Mecânico RGB',   price: 349  },
    { name: 'Mouse Sem Fio Logitech', price: 189  },
    { name: 'SSD NVMe 1TB',           price: 399  },
    { name: 'Headset 7.1 Surround',   price: 279  },
    { name: 'Webcam Full HD 1080p',   price: 219  },
    { name: 'Hub USB-C 8 em 1',       price: 149  },
  ],
  moda: [
    { name: 'Vestido Floral Midi',    price: 189  },
    { name: 'Bolsa Feminina Couro',   price: 329  },
    { name: 'Tênis Sneaker Premium',  price: 299  },
    { name: 'Conjunto Calça + Blusa', price: 219  },
    { name: 'Óculos de Sol Acetato',  price: 159  },
    { name: 'Perfume Feminino 100ml', price: 249  },
    { name: 'Relógio Feminino Rose',  price: 189  },
    { name: 'Sandália Plataforma',    price: 149  },
  ],
  casa: [
    { name: 'Sofá Retrátil 3 Lugares', price: 1899 },
    { name: 'Cama Box Casal Molas',    price: 1299 },
    { name: 'Mesa de Jantar 6 Lug.',   price: 1599 },
    { name: 'Colchão Queen Premium',   price: 1499 },
    { name: 'Poltrona Giratória',      price: 649  },
    { name: 'Rack TV Suspenso 180cm',  price: 499  },
    { name: 'Guarda-Roupa 6 Portas',   price: 999  },
    { name: 'Espelho Grande Moldura',  price: 389  },
  ],
  fitness: [
    { name: 'Whey Protein 2kg',        price: 189  },
    { name: 'Creatina 500g',           price: 89   },
    { name: 'BCAA 2:1:1 300g',         price: 69   },
    { name: 'Pré-Treino Extremo',      price: 129  },
    { name: 'Coqueteleira Premium',    price: 49   },
    { name: 'Luva Musculação',         price: 59   },
    { name: 'Faixa Elástica Resistência', price: 39 },
    { name: 'Tênis Running Pro',       price: 299  },
  ],
  eletro: [
    { name: 'TV 55" 4K QLED Smart',   price: 2999 },
    { name: 'Geladeira Frost Free 410L', price: 3299 },
    { name: 'Ar Condicionado 12000 BTU', price: 1799 },
    { name: 'Máquina de Lavar 11kg',   price: 2199 },
    { name: 'Micro-ondas 32L',         price: 599  },
    { name: 'Air Fryer 6L Digital',    price: 449  },
    { name: 'Cafeteira Expresso 20 Bar', price: 699 },
    { name: 'Aspirador Robô WiFi',     price: 1199 },
  ],
  beauty: [
    { name: 'Kit Skincare Vitamina C', price: 129  },
    { name: 'Sérum Anti-Idade 30ml',   price: 89   },
    { name: 'Paleta Sombras 35 Cores', price: 79   },
    { name: 'Base Líquida HD 30ml',    price: 59   },
    { name: 'Shampoo + Condicionador', price: 49   },
    { name: 'Escova Progressiva',      price: 149  },
    { name: 'Perfume Feminino EDP',    price: 199  },
    { name: 'Kit Manicure Profissional', price: 69 },
  ],
  moveis: [
    { name: 'Estante Sala Completa',   price: 1299 },
    { name: 'Cadeira de Escritório',   price: 799  },
    { name: 'Mesa Home Office',        price: 699  },
    { name: 'Painel Lareira Elétrica', price: 899  },
    { name: 'Cômoda 6 Gavetas',        price: 899  },
    { name: 'Sapateira Organizadora',  price: 399  },
    { name: 'Criado-Mudo Suspenso',    price: 299  },
    { name: 'Mesa de Centro Sala',     price: 499  },
  ],
  generic: [
    { name: 'Produto Destaque A',      price: 199  },
    { name: 'Produto Destaque B',      price: 299  },
    { name: 'Produto Destaque C',      price: 149  },
    { name: 'Produto Destaque D',      price: 399  },
    { name: 'Produto Destaque E',      price: 249  },
    { name: 'Produto Destaque F',      price: 89   },
    { name: 'Produto Destaque G',      price: 179  },
    { name: 'Produto Destaque H',      price: 329  },
  ],
}

// ── Archetype detection from slug ─────────────────────────────────────────────
function detectArchetype(slug: string): string {
  if (/tech|eletron|gamer|info/i.test(slug))   return 'tech'
  if (/moda|bella|fashion|roupa/i.test(slug))  return 'moda'
  if (/casa|confort|movel|design/i.test(slug)) return /movel|design/i.test(slug) ? 'moveis' : 'casa'
  if (/fit|suple|nutri|sport/i.test(slug))     return 'fitness'
  if (/eletro|premium|smart/i.test(slug))      return 'eletro'
  if (/beauty|cosmet|skin|belo/i.test(slug))   return 'beauty'
  return 'generic'
}

// ── Tier based on seed (determines volume) ────────────────────────────────────
function detectTier(rand: () => number): 'small' | 'medium' | 'large' {
  const v = rand()
  if (v < 0.30) return 'small'
  if (v < 0.70) return 'medium'
  return 'large'
}

const TIER_GMV = {
  small:  { base: 12_000,  range: 18_000  },
  medium: { base: 45_000,  range: 80_000  },
  large:  { base: 150_000, range: 200_000 },
}

// ── Main generator ─────────────────────────────────────────────────────────────
export function generateClientOverview(
  id: string,
  name: string,
  slug: string,
  activeMarketplaces: string[],
): ClientOverview {
  const rand = makePrng(strSeed(id))
  const archetype = detectArchetype(slug)
  const tier = detectTier(rand)
  const products = PRODUCT_POOLS[archetype] ?? PRODUCT_POOLS.generic
  const validMPs = activeMarketplaces
    .map(m => m.toLowerCase() as MarketplaceKey)
    .filter(m => MARKETPLACE_KEYS.includes(m))
  const mps = validMPs.length > 0 ? validMPs : ['mercadolivre' as MarketplaceKey]

  // GMV
  const { base, range } = TIER_GMV[tier]
  const gmv = Math.round(base + rand() * range)
  const orders = Math.round(gmv / (80 + rand() * 300))
  const avgTicket = gmv / orders
  const cancelRate = +(2 + rand() * 8).toFixed(1)
  const avgRating = +(3.5 + rand() * 1.4).toFixed(1)
  const adSpend = +(gmv * (0.08 + rand() * 0.18)).toFixed(2)
  const adRevenue = +(adSpend * (2 + rand() * 6)).toFixed(2)
  const roas = +(adRevenue / adSpend).toFixed(2)
  const trend = +(( rand() * 60 - 20)).toFixed(1)   // -20% to +40%
  const adTrend = +((rand() * 50 - 15)).toFixed(1)
  const productCount = Math.round(15 + rand() * 85)

  // Per-marketplace breakdown
  const mpWeights = mps.map(() => 0.5 + rand())
  const mpTotal = mpWeights.reduce((s, w) => s + w, 0)

  const byMarketplace: ClientMarketplaceStat[] = mps.map((mp, i) => {
    const share = mpWeights[i] / mpTotal
    const mpRevenue = +(gmv * share).toFixed(2)
    const mpOrders = Math.round(orders * share)
    const mpProducts = Math.round(productCount * (0.3 + rand() * 0.7))
    const mpAdSpend = +(adSpend * share).toFixed(2)
    const mpAdRevenue = +(mpAdSpend * (2 + rand() * 5)).toFixed(2)
    const mpRoas = +(mpAdRevenue / mpAdSpend).toFixed(2)
    return {
      marketplace: mp,
      revenue: mpRevenue,
      orders: mpOrders,
      products: mpProducts,
      adSpend: mpAdSpend,
      roas: mpRoas,
      avgRating: +(3.2 + rand() * 1.6).toFixed(1),
    }
  })

  const topMarketplace = byMarketplace.reduce((a, b) => a.revenue > b.revenue ? a : b).marketplace

  // Top products (pick from pool with seeded order)
  const shuffled = [...products].sort(() => rand() - 0.5)
  const topProducts = shuffled.slice(0, 5).map((p, i) => ({
    name: p.name,
    revenue: Math.round(gmv * (0.08 + rand() * 0.12)),
    marketplace: mps[i % mps.length],
  }))

  // Revenue by day (last 30 days)
  const revenueByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 29 + i)
    const date = d.toISOString().split('T')[0]
    const base = (gmv / 30) * (0.5 + rand() * 1.0)
    return { date, revenue: +base.toFixed(2) }
  })

  return {
    id, name, slug,
    gmv, orders, products: productCount,
    adSpend, roas, avgRating,
    avgTicket: +avgTicket.toFixed(2),
    cancelRate, trend, adTrend,
    activeMarketplaces: mps,
    topMarketplace,
    byMarketplace,
    revenueByDay,
    topProducts,
  }
}
