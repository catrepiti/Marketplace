import { MarketplaceKey } from './marketplaces'

export type Marketplace = MarketplaceKey

export type OrderStatus =
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export interface Order {
  id: string
  marketplace: Marketplace
  externalId: string
  customer: string
  product: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  shippingDeadline: string
}

export interface Feedback {
  id: string
  marketplace: Marketplace
  orderId: string
  customer: string
  rating: 1 | 2 | 3 | 4 | 5
  title: string
  comment: string
  replied: boolean
  replyText?: string
  createdAt: string
  product: string
}

export interface Question {
  id: string
  marketplace: Marketplace
  customer: string
  product: string
  question: string
  answered: boolean
  answer?: string
  createdAt: string
}

export interface PrevPeriodMetrics {
  totalRevenue: number
  totalOrders: number
  averageRating: number
  cancelRate: number
  averageTicket: number
}

export interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  averageTicket: number
  averageRating: number
  cancelRate: number
  prevPeriod: PrevPeriodMetrics
  byMarketplace: {
    marketplace: Marketplace
    revenue: number
    orders: number
    averageRating: number
  }[]
  salesByDay: ({ date: string; total: number } & Record<string, number | string>)[]
  topProducts: {
    product: string
    sku: string
    quantity: number
    revenue: number
    marketplace: Marketplace
  }[]
  recentOrders: Order[]
}

export interface AdCampaign {
  id: string
  marketplace: string
  name: string
  type: string
  status: 'active' | 'paused' | 'ended'
  impressions: number
  clicks: number
  spend: number
  conversions: number
  revenue: number
  startDate: string
}

export interface AdsMarketplaceBreakdown {
  marketplace: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  totalRevenue: number
  ctr: number
  cpc: number
  roas: number
  acos: number
  tacos: number
}

export interface AdsMetrics {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  totalSalesRevenue: number
  ctr: number
  cpc: number
  roas: number
  acos: number
  tacos: number
  prevPeriod: {
    totalSpend: number
    totalClicks: number
    totalConversions: number
    roas: number
    acos: number
    tacos: number
  }
  byMarketplace: AdsMarketplaceBreakdown[]
  spendByDay: ({ date: string; label: string; total: number } & Record<string, number | string>)[]
  campaigns: AdCampaign[]
}

export interface RealtimeSale {
  id: string
  marketplace: Marketplace
  customer: string
  product: string
  value: number
  timestamp: string
}

export interface FeedbackStats {
  total: number
  pending: number
  replied: number
  averageRating: number
  byRating: Record<1 | 2 | 3 | 4 | 5, number>
  byMarketplace: {
    marketplace: Marketplace
    total: number
    averageRating: number
    pending: number
  }[]
}
