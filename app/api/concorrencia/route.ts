import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCompetitorReport } from '@/lib/mock/competitor-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasData = await prisma.marketplaceAccount.count() > 0
  if (!hasData) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      products: [],
      categories: [],
      overallScore: 0,
      totalOpportunity: 0,
    })
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'all'

  const report = generateCompetitorReport(category)
  return NextResponse.json(report)
}
