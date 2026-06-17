import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface MLItem {
  id: string
  title: string
  price: number
  sold_quantity: number
  thumbnail: string
  permalink: string
  condition: string
  listing_type_id: string
  shipping: { free_shipping: boolean }
  seller: { id: number; nickname: string }
  address?: { state_name: string; city_name: string }
}

function extractKeywords(titles: string[]): { word: string; count: number; pct: number }[] {
  const stopwords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'um', 'uma', 'para', 'com',
    'por', 'no', 'na', 'nos', 'nas', 'ao', 'aos', 'à', 'às', 'o', 'a',
    'os', 'as', 'ou', 'que', 'se', 'é', 'não', 'mais', 'como', 'mas',
    'já', 'seu', 'sua', 'seus', 'suas', 'ele', 'ela', 'você', 'nós',
    'kit', 'und', 'un', 'pç', 'cx', '-', '+', 'x', '/', '|',
  ])

  const freq: Record<string, number> = {}
  for (const title of titles) {
    const words = title
      .toLowerCase()
      .replace(/[^a-záàâãéèêíïóôõúüç0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopwords.has(w))

    const seen = new Set<string>()
    for (const w of words) {
      if (!seen.has(w)) {
        freq[w] = (freq[w] ?? 0) + 1
        seen.add(w)
      }
    }
  }

  const total = titles.length
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
}

function extractBigrams(titles: string[]): { phrase: string; count: number; pct: number }[] {
  const stopwords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'um', 'uma', 'para', 'com',
    'por', 'no', 'na', 'nos', 'nas', 'ao', 'o', 'a', 'os', 'as', 'ou',
  ])

  const freq: Record<string, number> = {}
  for (const title of titles) {
    const words = title
      .toLowerCase()
      .replace(/[^a-záàâãéèêíïóôõúüç0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopwords.has(w))

    const seen = new Set<string>()
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`
      if (!seen.has(bigram)) {
        freq[bigram] = (freq[bigram] ?? 0) + 1
        seen.add(bigram)
      }
    }
  }

  const total = titles.length
  return Object.entries(freq)
    .map(([phrase, count]) => ({ phrase, count, pct: Math.round((count / total) * 100) }))
    .filter(b => b.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

function analyzeTitlePatterns(titles: string[]) {
  const lengths = titles.map(t => t.length)
  const avgLength = Math.round(lengths.reduce((s, l) => s + l, 0) / lengths.length)
  const wordCounts = titles.map(t => t.split(/\s+/).length)
  const avgWords = Math.round(wordCounts.reduce((s, w) => s + w, 0) / wordCounts.length)

  return { avgLength, avgWords, minLength: Math.min(...lengths), maxLength: Math.max(...lengths) }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'Parâmetro q obrigatório' }, { status: 400 })

  const sort = searchParams.get('sort') || 'relevance'
  const limit = Math.min(Number(searchParams.get('limit') || 50), 50)

  const mlUrl = new URL('https://api.mercadolibre.com/sites/MLB/search')
  mlUrl.searchParams.set('q', query)
  mlUrl.searchParams.set('limit', String(limit))
  mlUrl.searchParams.set('sort_id', sort)

  const category = searchParams.get('category')
  if (category) mlUrl.searchParams.set('category', category)

  try {
    const res = await fetch(mlUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao consultar Mercado Livre' }, { status: 502 })
    }

    const data = await res.json()
    const items: MLItem[] = data.results ?? []
    const titles = items.map(i => i.title)

    const prices = items.map(i => i.price).sort((a, b) => a - b)
    const totalSold = items.reduce((s, i) => s + (i.sold_quantity ?? 0), 0)
    const freeShippingCount = items.filter(i => i.shipping?.free_shipping).length
    const classicCount = items.filter(i => i.listing_type_id === 'gold_pro').length

    const priceAnalysis = prices.length > 0 ? {
      min: prices[0],
      max: prices[prices.length - 1],
      avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length * 100) / 100,
      median: prices[Math.floor(prices.length / 2)],
      p25: prices[Math.floor(prices.length * 0.25)],
      p75: prices[Math.floor(prices.length * 0.75)],
    } : null

    const keywords = extractKeywords(titles)
    const bigrams = extractBigrams(titles)
    const titlePatterns = analyzeTitlePatterns(titles)

    const sellerMap: Record<string, { name: string; items: number; totalSold: number }> = {}
    for (const item of items) {
      const sid = String(item.seller.id)
      if (!sellerMap[sid]) sellerMap[sid] = { name: item.seller.nickname, items: 0, totalSold: 0 }
      sellerMap[sid].items++
      sellerMap[sid].totalSold += item.sold_quantity ?? 0
    }
    const topSellers = Object.values(sellerMap)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10)

    const topListings = items
      .sort((a, b) => (b.sold_quantity ?? 0) - (a.sold_quantity ?? 0))
      .slice(0, 15)
      .map(i => ({
        id: i.id,
        title: i.title,
        price: i.price,
        sold: i.sold_quantity ?? 0,
        thumbnail: i.thumbnail?.replace('http://', 'https://') ?? '',
        permalink: i.permalink,
        freeShipping: i.shipping?.free_shipping ?? false,
        seller: i.seller.nickname,
        condition: i.condition,
        type: i.listing_type_id,
        location: i.address ? `${i.address.city_name}, ${i.address.state_name}` : null,
      }))

    const categories = data.available_filters
      ?.find((f: any) => f.id === 'category')
      ?.values?.slice(0, 10)
      ?.map((v: any) => ({ id: v.id, name: v.name, count: v.results })) ?? []

    return NextResponse.json({
      query,
      totalResults: data.paging?.total ?? 0,
      analyzedCount: items.length,
      priceAnalysis,
      keywords,
      bigrams,
      titlePatterns,
      topSellers,
      topListings,
      categories,
      stats: {
        totalSold,
        avgSoldPerListing: items.length > 0 ? Math.round(totalSold / items.length) : 0,
        freeShippingPct: items.length > 0 ? Math.round((freeShippingCount / items.length) * 100) : 0,
        premiumListingPct: items.length > 0 ? Math.round((classicCount / items.length) * 100) : 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro de conexão com Mercado Livre' }, { status: 502 })
  }
}
