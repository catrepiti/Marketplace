import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lastClosedWeek } from '@/lib/reports/generator'

export const dynamic = 'force-dynamic'

const MINER_URL = process.env.MINER_URL ?? 'http://localhost:3050'
const REVENUE_GOAL = 20000

async function fetchMiner(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${MINER_URL}${path}`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || !['ADMIN', 'ASSESSOR'].includes(role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const week = lastClosedWeek()

  const [clients, weekReports, minerQueue, minerStatus] = await Promise.all([
    prisma.client.findMany({
      select: {
        id: true,
        name: true,
        trialEndsAt: true,
        plan: { select: { name: true, price: true, interval: true } },
        _count: { select: { sales: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.weeklyReport.findMany({
      where: { weekStart: week.weekStart },
      select: { clientId: true, status: true, sentAt: true, totalRevenue: true },
    }),
    fetchMiner('/api/queue'),
    fetchMiner('/api/auto-mine'),
  ])

  const now = new Date()
  const paying = clients.filter(c => c.plan && (!c.trialEndsAt || c.trialEndsAt < now))
  const inTrial = clients.filter(c => c.trialEndsAt && c.trialEndsAt >= now)

  const mrr = paying.reduce((sum, c) => {
    if (!c.plan) return sum
    return sum + (c.plan.interval === 'yearly' ? c.plan.price / 12 : c.plan.price)
  }, 0)

  return NextResponse.json({
    goal: {
      target: REVENUE_GOAL,
      mrr,
      gap: Math.max(0, REVENUE_GOAL - mrr),
      progressPct: Math.min(100, (mrr / REVENUE_GOAL) * 100),
    },
    clients: {
      total: clients.length,
      paying: paying.length,
      inTrial: inTrial.length,
      list: clients.map(c => ({
        id: c.id,
        name: c.name,
        plan: c.plan?.name ?? null,
        monthlyValue: c.plan ? (c.plan.interval === 'yearly' ? c.plan.price / 12 : c.plan.price) : 0,
        inTrial: !!(c.trialEndsAt && c.trialEndsAt >= now),
        salesCount: c._count.sales,
      })),
    },
    reports: {
      weekStart: week.weekStart,
      generated: weekReports.length,
      sent: weekReports.filter(r => r.status === 'sent').length,
      totalClients: clients.length,
    },
    miner: minerQueue
      ? {
          online: true,
          inQueue: minerQueue.stats?.inQueue ?? 0,
          contactedToday: minerQueue.stats?.contactedToday ?? 0,
          contactedTotal: minerQueue.stats?.contacted ?? 0,
          totalLeads: minerQueue.stats?.total ?? 0,
          byStatus: minerQueue.stats?.byStatus ?? {},
          lastRun: minerStatus?.runs?.[0] ?? null,
          nichePerformance: minerStatus?.nichePerformance ?? {},
        }
      : { online: false },
  })
}
