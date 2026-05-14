/**
 * Inventory mock data — deterministic per SKU, editable in-memory during session.
 * Includes root-cause loss diagnosis per product.
 */
import { MarketplaceKey } from '@/lib/marketplaces'

export type StockStatus  = 'in_stock' | 'low_stock' | 'out_of_stock'
export type IssueType    = 'stockout' | 'stockout_risk' | 'slow_moving' | 'dead_stock' | 'healthy'

export interface LossReason {
  code: string         // machine-readable
  label: string        // short label shown as badge
  detail: string       // full diagnostic sentence
  severity: 'critical' | 'warning' | 'info'
  revenueLost: number  // R$ attributable to this reason
}

export interface StockItem {
  id: string
  sku: string
  name: string
  category: string
  marketplace: MarketplaceKey
  quantity: number
  minQuantity: number
  unitCost: number
  unitPrice: number
  status: StockStatus
  issueType: IssueType
  lastSale: string           // ISO date
  avgMonthlySales: number
  daysUntilStockout: number | null
  daysOutOfStock: number     // 0 if in stock
  lostRevenueLast30d: number // R$ — revenue missed due to stockout
  revenueAtRisk: number      // R$ — next 7d at risk if not restocked (low_stock)
  lossReasons: LossReason[]
  healthScore: number        // 0–100
  suggestedRestockQty: number
  imageEmoji: string
}

export interface InventoryStats {
  totalSkus: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
  totalRetailValue: number
  margin: number
  totalLostRevenue: number   // sum of lostRevenueLast30d
  totalRevenueAtRisk: number // sum of revenueAtRisk
  deadStockValue: number     // value tied up in dead/slow-moving stock
}

// ── Catalog ───────────────────────────────────────────────────────────────────
type SeedRow = Omit<StockItem,
  'status' | 'issueType' | 'daysUntilStockout' | 'daysOutOfStock' |
  'lostRevenueLast30d' | 'revenueAtRisk' | 'lossReasons' | 'healthScore' | 'suggestedRestockQty'
> & { daysOutOfStockFixed: number }

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
}

const SEED_DATA: SeedRow[] = [
  // ── Mercado Livre ──────────────────────────────────────────────────────────
  { id:'1',  sku:'ML-FON-001', name:'Fone Bluetooth JBL Tune 510BT',  category:'Eletrônicos',      marketplace:'mercadolivre', quantity:42,  minQuantity:10, unitCost:89.9,   unitPrice:189.9,  lastSale: daysAgo(0), avgMonthlySales:95,  imageEmoji:'🎧', daysOutOfStockFixed:0  },
  { id:'2',  sku:'ML-MOU-004', name:'Mouse Gamer Logitech G203',       category:'Eletrônicos',      marketplace:'mercadolivre', quantity:8,   minQuantity:10, unitCost:72.0,   unitPrice:159.9,  lastSale: daysAgo(1), avgMonthlySales:60,  imageEmoji:'🖱️',  daysOutOfStockFixed:0  },
  { id:'3',  sku:'ML-TEC-005', name:'Teclado Mecânico Redragon',       category:'Eletrônicos',      marketplace:'mercadolivre', quantity:0,   minQuantity:5,  unitCost:110.0,  unitPrice:249.9,  lastSale: daysAgo(3), avgMonthlySales:40,  imageEmoji:'⌨️',  daysOutOfStockFixed:3  },
  { id:'4',  sku:'ML-WEB-007', name:'Webcam Full HD 1080p',            category:'Eletrônicos',      marketplace:'mercadolivre', quantity:19,  minQuantity:5,  unitCost:95.0,   unitPrice:219.9,  lastSale: daysAgo(0), avgMonthlySales:35,  imageEmoji:'📷', daysOutOfStockFixed:0  },
  { id:'5',  sku:'ML-SUP-006', name:'Suporte Monitor Articulado',      category:'Escritório',       marketplace:'mercadolivre', quantity:31,  minQuantity:8,  unitCost:55.0,   unitPrice:129.9,  lastSale: daysAgo(0), avgMonthlySales:50,  imageEmoji:'🖥️',  daysOutOfStockFixed:0  },
  { id:'6',  sku:'ML-HUB-008', name:'Hub USB 7 Portas',                category:'Eletrônicos',      marketplace:'mercadolivre', quantity:4,   minQuantity:8,  unitCost:38.0,   unitPrice:89.9,   lastSale: daysAgo(2), avgMonthlySales:30,  imageEmoji:'🔌', daysOutOfStockFixed:0  },
  // ── Shopee ────────────────────────────────────────────────────────────────
  { id:'7',  sku:'SH-REL-001', name:'Relógio Smartwatch HW67 Pro',     category:'Eletrônicos',      marketplace:'shopee',       quantity:55,  minQuantity:15, unitCost:59.9,   unitPrice:149.9,  lastSale: daysAgo(0), avgMonthlySales:120, imageEmoji:'⌚', daysOutOfStockFixed:0  },
  { id:'8',  sku:'SH-SKI-002', name:'Kit Skincare Vitamina C',         category:'Beleza',           marketplace:'shopee',       quantity:6,   minQuantity:12, unitCost:28.0,   unitPrice:69.9,   lastSale: daysAgo(1), avgMonthlySales:80,  imageEmoji:'🧴', daysOutOfStockFixed:0  },
  { id:'9',  sku:'SH-TEN-004', name:'Tênis Esportivo Running',         category:'Esporte',          marketplace:'shopee',       quantity:22,  minQuantity:8,  unitCost:88.0,   unitPrice:199.9,  lastSale: daysAgo(0), avgMonthlySales:45,  imageEmoji:'👟', daysOutOfStockFixed:0  },
  { id:'10', sku:'SH-FIT-008', name:'Fita LED RGB 5m',                 category:'Casa',             marketplace:'shopee',       quantity:0,   minQuantity:20, unitCost:12.0,   unitPrice:44.9,   lastSale: daysAgo(5), avgMonthlySales:200, imageEmoji:'💡', daysOutOfStockFixed:5  },
  { id:'11', sku:'SH-MOC-005', name:'Mochila Notebook 15.6"',         category:'Acessórios',       marketplace:'shopee',       quantity:14,  minQuantity:10, unitCost:52.0,   unitPrice:119.9,  lastSale: daysAgo(0), avgMonthlySales:55,  imageEmoji:'🎒', daysOutOfStockFixed:0  },
  { id:'12', sku:'SH-LUM-003', name:'Luminária LED Mesa USB',          category:'Casa',             marketplace:'shopee',       quantity:38,  minQuantity:10, unitCost:18.0,   unitPrice:49.9,   lastSale: daysAgo(0), avgMonthlySales:90,  imageEmoji:'🔦', daysOutOfStockFixed:0  },
  // ── Amazon ────────────────────────────────────────────────────────────────
  { id:'13', sku:'AZ-ECH-001', name:'Echo Dot (5ª Geração)',           category:'Eletrônicos',      marketplace:'amazon',       quantity:28,  minQuantity:10, unitCost:189.0,  unitPrice:349.0,  lastSale: daysAgo(0), avgMonthlySales:70,  imageEmoji:'🔊', daysOutOfStockFixed:0  },
  { id:'14', sku:'AZ-KIN-002', name:'Kindle Paperwhite 16GB',          category:'Eletrônicos',      marketplace:'amazon',       quantity:3,   minQuantity:5,  unitCost:399.0,  unitPrice:699.0,  lastSale: daysAgo(1), avgMonthlySales:25,  imageEmoji:'📖', daysOutOfStockFixed:0  },
  { id:'15', sku:'AZ-HEA-005', name:'Headphone Over-Ear Noise Cancel', category:'Eletrônicos',      marketplace:'amazon',       quantity:17,  minQuantity:8,  unitCost:189.0,  unitPrice:399.9,  lastSale: daysAgo(0), avgMonthlySales:38,  imageEmoji:'🎧', daysOutOfStockFixed:0  },
  { id:'16', sku:'AZ-CAM-006', name:'Câmera Web Logitech C920',        category:'Eletrônicos',      marketplace:'amazon',       quantity:9,   minQuantity:5,  unitCost:229.0,  unitPrice:499.9,  lastSale: daysAgo(2), avgMonthlySales:22,  imageEmoji:'📹', daysOutOfStockFixed:0  },
  { id:'17', sku:'AZ-SUP-004', name:'Suporte Notebook Ajustável',      category:'Escritório',       marketplace:'amazon',       quantity:0,   minQuantity:8,  unitCost:79.0,   unitPrice:189.9,  lastSale: daysAgo(7), avgMonthlySales:30,  imageEmoji:'💻', daysOutOfStockFixed:7  },
]

// ── In-memory edits ───────────────────────────────────────────────────────────
const overrides = new Map<string, Partial<Pick<SeedRow, 'quantity'>>>()

// ── Loss diagnosis engine ─────────────────────────────────────────────────────
function buildDiagnosis(row: SeedRow, quantity: number): {
  issueType: IssueType
  lossReasons: LossReason[]
  lostRevenueLast30d: number
  revenueAtRisk: number
  healthScore: number
  suggestedRestockQty: number
  daysOutOfStock: number
} {
  const reasons: LossReason[] = []
  const dailySales  = row.avgMonthlySales / 30
  const daysOut     = row.daysOutOfStockFixed
  const daysSinceSale = Math.floor((Date.now() - new Date(row.lastSale).getTime()) / 86_400_000)
  const turnoverDays  = dailySales > 0 ? Math.round(quantity / dailySales) : 999

  // ── 1. Stockout ─────────────────────────────────────────────────────────
  const lostRevenue = +(daysOut * dailySales * row.unitPrice).toFixed(2)
  if (quantity === 0) {
    reasons.push({
      code: 'STOCKOUT',
      label: 'Ruptura de Estoque',
      severity: 'critical',
      revenueLost: lostRevenue,
      detail: `Produto sem estoque há ${daysOut} dia${daysOut !== 1 ? 's' : ''}. Perda estimada: R$ ${lostRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em receita não realizada.`,
    })
  }

  // ── 2. Below minimum (risk of stockout) ─────────────────────────────────
  if (quantity > 0 && quantity <= row.minQuantity) {
    const daysToRun = Math.round(quantity / dailySales)
    const riskRevenue = +(Math.max(0, 7 - daysToRun) * dailySales * row.unitPrice).toFixed(2)
    reasons.push({
      code: 'BELOW_MIN',
      label: 'Abaixo do Mínimo',
      severity: 'critical',
      revenueLost: 0,
      detail: `Estoque de ${quantity} un está abaixo do mínimo de ${row.minQuantity} un. Previsão de ruptura em ${daysToRun} dia${daysToRun !== 1 ? 's' : ''} com a demanda atual de ${row.avgMonthlySales} un/mês.`,
    })
    if (riskRevenue > 0) {
      reasons.push({
        code: 'STOCKOUT_RISK',
        label: 'Risco de Ruptura',
        severity: 'warning',
        revenueLost: riskRevenue,
        detail: `Se não reabastecido, os próximos 7 dias colocam em risco R$ ${riskRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em vendas potenciais.`,
      })
    }
  }

  // ── 3. Dead stock / no movement ─────────────────────────────────────────
  if (daysSinceSale > 14 && quantity > 0) {
    const deadValue = +(quantity * row.unitCost).toFixed(2)
    reasons.push({
      code: 'DEAD_STOCK',
      label: 'Estoque Parado',
      severity: daysSinceSale > 30 ? 'critical' : 'warning',
      revenueLost: 0,
      detail: `Última venda há ${daysSinceSale} dias. R$ ${deadValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em capital imobilizado. Verifique precificação, listagem e visibilidade do anúncio.`,
    })
  }

  // ── 4. Slow-moving (high stock, low sales rate) ──────────────────────────
  if (quantity > 0 && turnoverDays > 60 && daysSinceSale <= 14) {
    reasons.push({
      code: 'SLOW_MOVING',
      label: 'Giro Lento',
      severity: 'warning',
      revenueLost: 0,
      detail: `Estoque para ${turnoverDays} dias de vendas — acima do ideal de 30 dias. Considere promoção para acelerar o giro e liberar capital.`,
    })
  }

  // ── 5. Sales drop indicator ──────────────────────────────────────────────
  if (daysSinceSale >= 2 && daysSinceSale <= 14 && quantity > row.minQuantity) {
    reasons.push({
      code: 'SALES_GAP',
      label: 'Intervalo sem Venda',
      severity: 'info',
      revenueLost: +(daysSinceSale * dailySales * row.unitPrice * 0.5).toFixed(2),
      detail: `Última venda registrada há ${daysSinceSale} dia${daysSinceSale !== 1 ? 's' : ''}. Para um produto com média de ${row.avgMonthlySales} vendas/mês, isso pode indicar queda de visibilidade ou concorrência de preço.`,
    })
  }

  // ── Health score ─────────────────────────────────────────────────────────
  let score = 100
  if (quantity === 0)                        score -= 50
  else if (quantity <= row.minQuantity)      score -= 30
  if (daysSinceSale > 30)                    score -= 25
  else if (daysSinceSale > 14)               score -= 15
  if (turnoverDays > 90)                     score -= 20
  else if (turnoverDays > 60)                score -= 10
  const healthScore = Math.max(0, score)

  // ── Issue type ───────────────────────────────────────────────────────────
  let issueType: IssueType = 'healthy'
  if (quantity === 0)                                          issueType = 'stockout'
  else if (quantity <= row.minQuantity)                        issueType = 'stockout_risk'
  else if (daysSinceSale > 30)                                 issueType = 'dead_stock'
  else if (turnoverDays > 60)                                  issueType = 'slow_moving'

  // ── Revenue metrics ──────────────────────────────────────────────────────
  const revenueAtRisk = quantity > 0 && quantity <= row.minQuantity
    ? +(Math.max(0, (row.minQuantity - quantity + 1) * dailySales * row.unitPrice * 7).toFixed(2))
    : 0

  const suggestedRestockQty = Math.max(row.minQuantity * 2, Math.round(row.avgMonthlySales * 1.5))

  return { issueType, lossReasons: reasons, lostRevenueLast30d: lostRevenue, revenueAtRisk, healthScore, suggestedRestockQty, daysOutOfStock: daysOut }
}

function computeItem(raw: SeedRow): StockItem {
  const qty    = overrides.get(raw.id)?.quantity ?? raw.quantity
  const merged = { ...raw, quantity: qty }
  const diag   = buildDiagnosis(merged, qty)

  const status: StockStatus =
    qty === 0 ? 'out_of_stock' :
    qty <= raw.minQuantity ? 'low_stock' : 'in_stock'

  const daysUntilStockout = raw.avgMonthlySales > 0 && qty > 0
    ? Math.round((qty / (raw.avgMonthlySales / 30)))
    : qty === 0 ? 0 : null

  const { daysOutOfStockFixed: _, ...rest } = merged
  return { ...rest, quantity: qty, status, daysUntilStockout, ...diag }
}

export function getInventory(filters?: {
  marketplace?: string; category?: string; status?: StockStatus; search?: string
}): StockItem[] {
  let items = SEED_DATA.map(computeItem)
  if (filters?.marketplace) items = items.filter(i => i.marketplace === filters.marketplace)
  if (filters?.category)    items = items.filter(i => i.category    === filters.category)
  if (filters?.status)      items = items.filter(i => i.status      === filters.status)
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
  }
  return items
}

export function updateStock(id: string, quantity: number): StockItem | null {
  const raw = SEED_DATA.find(i => i.id === id)
  if (!raw) return null
  overrides.set(id, { quantity })
  return computeItem(raw)
}

export function getInventoryStats(): InventoryStats {
  const items = SEED_DATA.map(computeItem)
  return {
    totalSkus:          items.length,
    inStock:            items.filter(i => i.status === 'in_stock').length,
    lowStock:           items.filter(i => i.status === 'low_stock').length,
    outOfStock:         items.filter(i => i.status === 'out_of_stock').length,
    totalValue:         +items.reduce((s, i) => s + i.quantity * i.unitCost, 0).toFixed(2),
    totalRetailValue:   +items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2),
    margin:             +(items.reduce((s, i) => s + ((i.unitPrice - i.unitCost) / i.unitPrice) * 100, 0) / items.length).toFixed(1),
    totalLostRevenue:   +items.reduce((s, i) => s + i.lostRevenueLast30d, 0).toFixed(2),
    totalRevenueAtRisk: +items.reduce((s, i) => s + i.revenueAtRisk, 0).toFixed(2),
    deadStockValue:     +items.filter(i => i.issueType === 'dead_stock' || i.issueType === 'slow_moving').reduce((s, i) => s + i.quantity * i.unitCost, 0).toFixed(2),
  }
}

export const INVENTORY_CATEGORIES = Array.from(new Set(SEED_DATA.map(i => i.category)))
