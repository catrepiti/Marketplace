import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReportForClient, generateReportsForAllClients } from '@/lib/reports/generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role
  const userId = (session.user as any)?.id
  const { searchParams } = new URL(request.url)
  let clientId = searchParams.get('clientId')

  if (role === 'CLIENT') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clientId: true } })
    clientId = user?.clientId ?? null
    if (!clientId) return NextResponse.json({ reports: [] })
  }

  const reports = await prisma.weeklyReport.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: { select: { name: true, slug: true } } },
    orderBy: [{ weekStart: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  })

  return NextResponse.json({ reports })
}

export async function POST(request: Request) {
  // Autenticação: sessão da equipe OU secret de cron (para geração agendada)
  const cronSecret = request.headers.get('x-cron-secret')
  const isCron = !!process.env.REPORTS_CRON_SECRET && cronSecret === process.env.REPORTS_CRON_SECRET

  if (!isCron) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || !['ADMIN', 'ASSESSOR'].includes(role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
  }

  let clientId: string | null = null
  try {
    const body = await request.json()
    clientId = body?.clientId ?? null
  } catch {}

  if (clientId) {
    const report = await generateReportForClient(clientId)
    return NextResponse.json({ ok: true, report })
  }

  const results = await generateReportsForAllClients()
  return NextResponse.json({ ok: true, results })
}
