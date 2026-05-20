const ML_BASE = 'https://api.mercadolibre.com'

export interface MLOrder {
  id: number
  status: string
  date_created: string
  date_closed: string
  total_amount: number
  order_items: { item: { id: string; title: string }; quantity: number; unit_price: number }[]
  buyer: { id: number; nickname: string }
  shipping: { id: number }
}

export interface MLFeedback {
  id: number
  rating_value: 'positive' | 'negative' | 'neutral'
  comment?: string
  date_created: string
  order_id: number
  message?: string
  item?: { id: string; title: string }
  buyer?: { id: number; nickname: string }
}

async function mlFetch(path: string, token: string) {
  const res = await fetch(`${ML_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ML API ${path} → ${res.status}: ${JSON.stringify(err)}`)
  }
  return res.json()
}

export async function mlGetUser(token: string) {
  return mlFetch('/users/me', token)
}

export async function mlGetOrders(sellerId: string, token: string, days = 30): Promise<MLOrder[]> {
  const from = new Date(Date.now() - days * 86400000).toISOString()
  let orders: MLOrder[] = []
  let offset = 0
  const limit = 50
  while (true) {
    const data = await mlFetch(
      `/orders/search?seller=${sellerId}&order.date_created.from=${from}&sort=date_desc&limit=${limit}&offset=${offset}`,
      token
    )
    const results: MLOrder[] = data.results ?? []
    orders = [...orders, ...results]
    if (results.length < limit) break
    offset += limit
    if (offset >= 500) break // max 500 to avoid rate limits
  }
  return orders
}

export async function mlGetFeedbacks(sellerId: string, token: string): Promise<MLFeedback[]> {
  try {
    const data = await mlFetch(`/users/${sellerId}/feedback/received?limit=100`, token)
    return data.feedback ?? []
  } catch { return [] }
}

export async function mlGetItems(sellerId: string, token: string) {
  try {
    const search = await mlFetch(`/users/${sellerId}/items/search?limit=100`, token)
    const ids: string[] = search.results ?? []
    if (ids.length === 0) return []
    // fetch in batches of 20
    const batches = []
    for (let i = 0; i < ids.length; i += 20) batches.push(ids.slice(i, i + 20))
    const items = []
    for (const batch of batches) {
      const data = await mlFetch(`/items?ids=${batch.join(',')}`, token)
      items.push(...(Array.isArray(data) ? data.map((r: any) => r.body).filter(Boolean) : []))
    }
    return items
  } catch { return [] }
}

export async function mlRefreshToken(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch(`${ML_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number; user_id: number }>
}

export function mlAuthUrl(clientId: string, redirectUri: string, state: string) {
  return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
}

export async function mlExchangeCode(clientId: string, clientSecret: string, code: string, redirectUri: string) {
  const res = await fetch(`${ML_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token exchange failed: ${JSON.stringify(err)}`)
  }
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number; user_id: number }>
}
