/**
 * Competitor price intelligence with per-product battle plans.
 * Prices shift each minute via seeded LCG to simulate live data.
 */
import { MarketplaceKey } from '@/lib/marketplaces'

// ── Types ─────────────────────────────────────────────────────────────────────
export type PricePosition = 'cheapest' | 'below_avg' | 'on_avg' | 'above_avg' | 'most_expensive'
export type StrategyType  = 'price_attack' | 'value_capture' | 'dominate' | 'defend_hold'

export interface CompetitorPrice {
  name: string
  price: number
  rating: number
  sales: number
  freeShipping: boolean
}

export interface BattleStep {
  priority: 'urgent' | 'high' | 'medium'
  icon: string
  action: string   // short verb phrase — what to do
  detail: string   // why + expected result with numbers
}

export interface WinStrategy {
  type: StrategyType
  badge: string              // label shown in UI
  headline: string           // "Reduza para R$169,90 e vença a Loja Alpha"
  summary: string            // 2-sentence executive reasoning
  targetPrice: number | null // the specific price to move to
  targetCompetitor: string | null  // competitor name to beat
  winProbability: number     // 0–100
  estimatedVolumeGain: number   // +units/month
  estimatedRevenueGain: number  // R$/month
  steps: BattleStep[]
}

export interface CompetitorProduct {
  id: string
  name: string
  sku: string
  category: string
  yourPrice: number
  yourSales: number
  marketplace: MarketplaceKey
  competitors: CompetitorPrice[]
  avgMarket: number
  minMarket: number
  maxMarket: number
  position: PricePosition
  priceDiff: number
  opportunity: 'raise' | 'lower' | 'hold'
  estimatedGainIfOptimized: number
  winStrategy: WinStrategy
}

export interface CategorySummary {
  category: string
  products: number
  avgYourPrice: number
  avgMarketPrice: number
  cheaperCount: number
  expensiveCount: number
  avgPositionScore: number
}

export interface CompetitorReport {
  generatedAt: string
  products: CompetitorProduct[]
  categories: CategorySummary[]
  overallScore: number
  totalOpportunity: number
}

// ── Catalog ───────────────────────────────────────────────────────────────────
const CATALOG: { name: string; sku: string; category: string; basePrice: number; marketplace: MarketplaceKey }[] = [
  { name: 'Fone Bluetooth JBL Tune 510BT',   sku: 'ML-FON-001', category: 'Eletrônicos',      basePrice: 189.9,  marketplace: 'mercadolivre' },
  { name: 'Mouse Gamer Logitech G203',        sku: 'ML-MOU-004', category: 'Eletrônicos',      basePrice: 159.9,  marketplace: 'mercadolivre' },
  { name: 'Teclado Mecânico Redragon',        sku: 'ML-TEC-005', category: 'Eletrônicos',      basePrice: 249.9,  marketplace: 'mercadolivre' },
  { name: 'Webcam Full HD 1080p',             sku: 'ML-WEB-007', category: 'Eletrônicos',      basePrice: 219.9,  marketplace: 'mercadolivre' },
  { name: 'Echo Dot (5ª Geração)',            sku: 'AZ-ECH-001', category: 'Eletrônicos',      basePrice: 349.0,  marketplace: 'amazon' },
  { name: 'Headphone Over-Ear Noise Cancel',  sku: 'AZ-HEA-005', category: 'Eletrônicos',      basePrice: 399.9,  marketplace: 'amazon' },
  { name: 'Câmera Web Logitech C920',         sku: 'AZ-CAM-006', category: 'Eletrônicos',      basePrice: 499.9,  marketplace: 'amazon' },
  { name: 'Kit Skincare Vitamina C',          sku: 'SH-SKI-002', category: 'Beleza',           basePrice: 69.9,   marketplace: 'shopee' },
  { name: 'Tênis Esportivo Running',          sku: 'SH-TEN-004', category: 'Esporte',          basePrice: 199.9,  marketplace: 'shopee' },
  { name: 'Relógio Smartwatch HW67 Pro',      sku: 'SH-REL-001', category: 'Eletrônicos',      basePrice: 149.9,  marketplace: 'shopee' },
]

const COMPETITOR_NAMES = ['Loja Alpha', 'Shop Prime', 'MegaStore', 'VendeMais', 'Top Seller', 'Fast Shop']

function noise(base: number, variance: number, seed: number): number {
  const tick = Math.floor(Date.now() / 60_000)
  const h = ((seed * 1664525 + tick * 1013904223) & 0xffffffff) >>> 0
  const r = (h / 0xffffffff) * 2 - 1
  return +(base * (1 + r * variance)).toFixed(2)
}

function fmtR(n: number) { return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

function pricePosition(yourPrice: number, avg: number, min: number): PricePosition {
  const diff = ((yourPrice - avg) / avg) * 100
  if (yourPrice <= min * 1.02) return 'cheapest'
  if (diff < -8)               return 'below_avg'
  if (diff <= 8)               return 'on_avg'
  if (diff <= 20)              return 'above_avg'
  return 'most_expensive'
}

// ── Battle plan builder ────────────────────────────────────────────────────────
function buildWinStrategy(
  yourPrice: number,
  yourSales: number,
  competitors: CompetitorPrice[],
  position: PricePosition,
  avgMarket: number,
  minMarket: number,
): WinStrategy {
  const sortedByPrice   = [...competitors].sort((a, b) => a.price - b.price)
  const cheapestComp    = sortedByPrice[0]
  const priciest        = sortedByPrice[sortedByPrice.length - 1]
  const topSeller       = [...competitors].sort((a, b) => b.sales - a.sales)[0]
  const totalCompSales  = competitors.reduce((s, c) => s + c.sales, 0)
  const yourMarketShare = Math.round((yourSales / (yourSales + totalCompSales)) * 100)
  const dailySales      = yourSales / 30

  // ─────────────────────────────────────────────────────────────────────────
  // STRATEGY: PRICE ATTACK — you're above avg, need to reduce
  if (position === 'most_expensive' || position === 'above_avg') {
    const nearestCompetitor = sortedByPrice.find(c => c.price < yourPrice) ?? cheapestComp
    const targetPrice       = +(nearestCompetitor.price * 0.99).toFixed(2)  // 1% below nearest comp
    const priceDrop         = yourPrice - targetPrice
    const conversionGain    = Math.round(Math.min(35, (priceDrop / yourPrice) * 100 * 3.5))
    const volumeGain        = Math.round(yourSales * (conversionGain / 100))
    const revenueGain       = Math.round(volumeGain * targetPrice)
    const marginLost        = +(priceDrop * yourSales).toFixed(2)

    return {
      type: 'price_attack',
      badge: '⚔️ Atacar Preço',
      headline: `Reduza para ${fmtR(targetPrice)} e supere ${nearestCompetitor.name}`,
      summary: `Você está ${((yourPrice - avgMarket) / avgMarket * 100).toFixed(1)}% acima da média de mercado, perdendo visibilidade no algoritmo do marketplace. ${nearestCompetitor.name} lidera com ${fmtR(nearestCompetitor.price)} e captura ~${Math.round((nearestCompetitor.sales / (yourSales + totalCompSales)) * 100)}% das vendas nessa categoria.`,
      targetPrice,
      targetCompetitor: nearestCompetitor.name,
      winProbability: Math.min(82, 55 + conversionGain),
      estimatedVolumeGain: volumeGain,
      estimatedRevenueGain: revenueGain,
      steps: [
        {
          priority: 'urgent',
          icon: '💰',
          action: `Ajuste o preço de ${fmtR(yourPrice)} para ${fmtR(targetPrice)}`,
          detail: `Queda de ${fmtR(priceDrop)} por unidade, mas ganho estimado de +${volumeGain} vendas/mês. Impacto líquido: +${fmtR(revenueGain - marginLost)}/mês.`,
        },
        {
          priority: 'high',
          icon: '🚚',
          action: nearestCompetitor.freeShipping ? 'Ative frete grátis para nivelar com o concorrente' : 'Mantenha frete grátis como vantagem competitiva',
          detail: `${nearestCompetitor.freeShipping ? `${nearestCompetitor.name} já oferece frete grátis — sem frete grátis você perde posição no ranking mesmo com preço igual.` : `${nearestCompetitor.name} cobra frete. Isso é uma vantagem que aumenta conversão em até 12%.`}`,
        },
        {
          priority: 'high',
          icon: '⭐',
          action: 'Solicite avaliações dos últimos compradores',
          detail: `Você tem market share de ~${yourMarketShare}% nessa categoria. Com preço competitivo + avaliações acima de 4.5★, o algoritmo prioriza seu anúncio nos resultados.`,
        },
        {
          priority: 'medium',
          icon: '📸',
          action: 'Revise fotos e título do anúncio',
          detail: `Com preços similares, qualidade visual do anúncio e título com palavras-chave corretas são o fator decisivo. Produtos com fotos profissionais convertem 23% mais.`,
        },
      ],
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STRATEGY: VALUE CAPTURE — you're the cheapest, can raise
  if (position === 'cheapest') {
    const secondCheapest = sortedByPrice[0]
    const targetPrice    = +(Math.min(avgMarket * 0.95, secondCheapest.price * 0.97)).toFixed(2)
    const priceIncrease  = targetPrice - yourPrice
    const volumeLoss     = Math.round(yourSales * 0.05)  // conservative estimate: -5%
    const revenueGain    = Math.round((yourSales - volumeLoss) * targetPrice - yourSales * yourPrice)

    return {
      type: 'value_capture',
      badge: '💹 Capturar Margem',
      headline: `Aumente para ${fmtR(targetPrice)} — você lidera sem precisar ser o mais barato`,
      summary: `Você está ${fmtR(yourPrice - secondCheapest.price)} abaixo do concorrente mais próximo (${secondCheapest.name}, ${fmtR(secondCheapest.price)}), deixando margem na mesa sem benefício em volume. Ser o mais barato não garante mais vendas se a diferença não for percebida pelo consumidor.`,
      targetPrice,
      targetCompetitor: secondCheapest.name,
      winProbability: 78,
      estimatedVolumeGain: -volumeLoss,
      estimatedRevenueGain: revenueGain,
      steps: [
        {
          priority: 'urgent',
          icon: '💰',
          action: `Ajuste gradualmente para ${fmtR(targetPrice)} (2–3 dias)`,
          detail: `Aumento de ${fmtR(priceIncrease)}/un. Perda estimada de apenas ${volumeLoss} venda(s)/mês, mas ganho de margem de +${fmtR(revenueGain)}/mês.`,
        },
        {
          priority: 'high',
          icon: '📦',
          action: 'Destaque diferenciais no anúncio: prazo de envio, garantia, nota fiscal',
          detail: `Com preço igual ao mercado, os compradores decidem por confiança e condições. Mencione explicitamente "NF incluída", "envio no mesmo dia" ou "garantia de X meses" no título/descrição.`,
        },
        {
          priority: 'medium',
          icon: '🎯',
          action: 'Crie kit ou bundle com produto complementar',
          detail: `Bundles aumentam ticket médio em 30–45% sem canibalizar o produto principal. Combine com acessório de baixo custo e ofereça como "kit econômico".`,
        },
      ],
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STRATEGY: DOMINATE — below avg, can grow volume and hold advantage
  if (position === 'below_avg') {
    const revenueGainByAds = Math.round(yourSales * 0.25 * yourPrice)
    return {
      type: 'dominate',
      badge: '🏆 Dominar Categoria',
      headline: `Posição forte — escale com anúncios e conquiste os ${Math.round((1 - yourMarketShare / 100) * 100)}% de share restantes`,
      summary: `Você está bem posicionado a ${Math.abs(((yourPrice - avgMarket) / avgMarket * 100)).toFixed(1)}% abaixo da média de mercado com estoque e vendas ativas. Esta é a posição ideal para escalar volume via mídia paga sem precisar reduzir preço.`,
      targetPrice: null,
      targetCompetitor: topSeller.name,
      winProbability: 85,
      estimatedVolumeGain: Math.round(yourSales * 0.25),
      estimatedRevenueGain: revenueGainByAds,
      steps: [
        {
          priority: 'urgent',
          icon: '📣',
          action: `Ative Produto Patrocinado com lance de 12–15% do preço`,
          detail: `Com preço competitivo, o CPC pago converte bem. Meta: aparecer nas 3 primeiras posições de busca. Retorno esperado: ROAS 4–6x para essa faixa de preço.`,
        },
        {
          priority: 'high',
          icon: '⭐',
          action: `Alcance 50+ avaliações para desbancar ${topSeller.name} (${topSeller.sales} vendas/mês)`,
          detail: `${topSeller.name} vende ${topSeller.sales} unidades/mês vs suas ${yourSales}. A diferença está em volume de avaliações. Envie mensagem pós-compra solicitando avaliação para acelerar esse processo.`,
        },
        {
          priority: 'high',
          icon: '🔖',
          action: 'Aplique cupom de 5% no anúncio para aumentar CTR',
          detail: `Cupons aumentam a taxa de cliques em 18–25% nos marketplaces. Com o preço já competitivo, um cupom visível no card do produto maximiza a conversão sem comprometer a margem.`,
        },
        {
          priority: 'medium',
          icon: '🗓️',
          action: 'Cadastre o produto em campanhas sazonais do marketplace',
          detail: `Produtos com posição de preço competitiva aprovados em campanhas (Black Friday, Dia das Mães, etc.) recebem destaque gratuito e aumento de 3–5x no volume.`,
        },
      ],
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STRATEGY: DEFEND & HOLD — on average, stable
  const nearestExpensive = sortedByPrice.find(c => c.price > yourPrice)
  return {
    type: 'defend_hold',
    badge: '🛡️ Defender & Otimizar',
    headline: `Preço na média — diferencie com serviço para converter sem baixar preço`,
    summary: `Você está alinhado com a média de mercado (${fmtR(avgMarket)}). Guerras de preço aqui corroem margem sem ganho real de volume. A alavanca de crescimento é qualidade de atendimento, velocidade de envio e conteúdo do anúncio.`,
    targetPrice: null,
    targetCompetitor: null,
    winProbability: 60,
    estimatedVolumeGain: Math.round(yourSales * 0.15),
    estimatedRevenueGain: Math.round(yourSales * 0.15 * yourPrice),
    steps: [
      {
        priority: 'high',
        icon: '🚀',
        action: 'Reduza prazo de envio para "Mesmo dia" ou "1 dia útil"',
        detail: `Prazo de envio é o principal critério de desempate quando preços são similares. Anúncios com envio em 24h aparecem em destaque no filtro "Entrega rápida" — +35% de visibilidade.`,
      },
      {
        priority: 'high',
        icon: '📋',
        action: 'Melhore a descrição com perguntas e respostas frequentes',
        detail: `${competitors.filter(c => c.rating >= 4.5).length} de ${competitors.length} concorrentes têm avaliação ≥4.5★. Responder dúvidas antes de surgirem reduz perguntas pre-venda e aumenta taxa de conversão.`,
      },
      {
        priority: 'medium',
        icon: '📦',
        action: 'Ofereça opção de parcelamento sem juros em mais vezes',
        detail: `Produtos de ${fmtR(yourPrice)} parcelados em 6x sem juros aparecem como "6x de ${fmtR(yourPrice / 6)}" — reduz a percepção de custo e aumenta conversão em ~20% para esse ticket.`,
      },
      {
        priority: 'medium',
        icon: '🎁',
        action: 'Adicione brinde ou embalagem diferenciada',
        detail: `Para preços iguais, experiência de unboxing gera avaliações espontâneas positivas. Um acessório simples (valor ≤ ${fmtR(yourPrice * 0.05)}) pode ser mencionado no título como "Brinde exclusivo".`,
      },
    ],
  }
}

export function generateCompetitorReport(category?: string): CompetitorReport {
  const items = category && category !== 'all'
    ? CATALOG.filter(p => p.category === category)
    : CATALOG

  const products: CompetitorProduct[] = items.map((item, idx) => {
    const seed     = idx * 31337
    const yourPrice = noise(item.basePrice, 0.03, seed)
    const compCount = 3 + (seed % 3)

    const competitors: CompetitorPrice[] = Array.from({ length: compCount }, (_, i) => {
      const cSeed = seed + i * 9999
      return {
        name: COMPETITOR_NAMES[i % COMPETITOR_NAMES.length],
        price: noise(item.basePrice, 0.18, cSeed),
        rating: +(3.5 + ((cSeed % 30) / 20)).toFixed(1),
        sales: Math.round(50 + (cSeed % 200)),
        freeShipping: (cSeed % 3) !== 0,
      }
    })

    const allPrices  = [yourPrice, ...competitors.map(c => c.price)]
    const avgMarket  = +(allPrices.reduce((a, b) => a + b, 0) / allPrices.length).toFixed(2)
    const minMarket  = +Math.min(...allPrices).toFixed(2)
    const maxMarket  = +Math.max(...allPrices).toFixed(2)
    const priceDiff  = +(((yourPrice - avgMarket) / avgMarket) * 100).toFixed(1)
    const position   = pricePosition(yourPrice, avgMarket, minMarket)
    const yourSales  = Math.round(80 + (seed % 150))

    const opportunity: 'raise' | 'lower' | 'hold' =
      position === 'most_expensive' || position === 'above_avg' ? 'lower' :
      position === 'cheapest' ? 'raise' : 'hold'

    const winStrategy = buildWinStrategy(yourPrice, yourSales, competitors, position, avgMarket, minMarket)

    const estimatedGainIfOptimized = winStrategy.estimatedRevenueGain

    return {
      id: item.sku, name: item.name, sku: item.sku, category: item.category,
      yourPrice, yourSales, marketplace: item.marketplace,
      competitors, avgMarket, minMarket, maxMarket,
      position, priceDiff, opportunity, estimatedGainIfOptimized, winStrategy,
    }
  })

  const cats = Array.from(new Set(products.map(p => p.category)))
  const categories: CategorySummary[] = cats.map(cat => {
    const ps = products.filter(p => p.category === cat)
    const scores: Record<PricePosition, number> = { cheapest: 100, below_avg: 75, on_avg: 50, above_avg: 25, most_expensive: 0 }
    return {
      category: cat,
      products: ps.length,
      avgYourPrice: +(ps.reduce((s, p) => s + p.yourPrice, 0) / ps.length).toFixed(2),
      avgMarketPrice: +(ps.reduce((s, p) => s + p.avgMarket, 0) / ps.length).toFixed(2),
      cheaperCount: ps.filter(p => p.position === 'cheapest' || p.position === 'below_avg').length,
      expensiveCount: ps.filter(p => p.position === 'above_avg' || p.position === 'most_expensive').length,
      avgPositionScore: Math.round(ps.reduce((s, p) => s + scores[p.position], 0) / ps.length),
    }
  })

  const overallScore    = Math.round(categories.reduce((s, c) => s + c.avgPositionScore, 0) / categories.length)
  const totalOpportunity = +products.reduce((s, p) => s + Math.max(0, p.estimatedGainIfOptimized), 0).toFixed(2)

  return { generatedAt: new Date().toISOString(), products, categories, overallScore, totalOpportunity }
}

export const PRODUCT_CATEGORIES = ['all', ...Array.from(new Set(CATALOG.map(p => p.category)))]
