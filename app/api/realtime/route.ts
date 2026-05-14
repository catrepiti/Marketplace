import { NextResponse } from 'next/server'
import { generateRealtimeSale } from '@/lib/mock/generator'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Returns 1-3 new "realtime" sales each poll
  const count = Math.random() > 0.4 ? (Math.random() > 0.6 ? 2 : 1) : 0
  const sales = Array.from({ length: count }, () => generateRealtimeSale())
  return NextResponse.json({ sales })
}
