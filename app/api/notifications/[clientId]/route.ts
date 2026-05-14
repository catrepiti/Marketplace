import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp, testMsgTemplate } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

type Params = { params: { clientId: string } }

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

// GET — load config + last 20 logs
export async function GET(_: Request, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const config = await prisma.notificationConfig.findUnique({ where: { clientId: params.clientId } })
  const logs   = await prisma.notificationLog.findMany({
    where:   { clientId: params.clientId },
    orderBy: { sentAt: 'desc' },
    take:    20,
  })

  return NextResponse.json({ config, logs })
}

// PUT — upsert config
export async function PUT(request: Request, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await request.json()
  const config = await prisma.notificationConfig.upsert({
    where:  { clientId: params.clientId },
    update: {
      phoneNumber:      body.phoneNumber      ?? '',
      apiUrl:           body.apiUrl           ?? '',
      apiKey:           body.apiKey           ?? '',
      apiInstance:      body.apiInstance      ?? '',
      notifyOnSale:     body.notifyOnSale     ?? true,
      notifyOnFeedback: body.notifyOnFeedback ?? true,
      notifyOnQuestion: body.notifyOnQuestion ?? false,
      minSaleValue:     Number(body.minSaleValue ?? 0),
      active:           body.active           ?? true,
      updatedAt:        new Date(),
    },
    create: {
      clientId:         params.clientId,
      phoneNumber:      body.phoneNumber      ?? '',
      apiUrl:           body.apiUrl           ?? '',
      apiKey:           body.apiKey           ?? '',
      apiInstance:      body.apiInstance      ?? '',
      notifyOnSale:     body.notifyOnSale     ?? true,
      notifyOnFeedback: body.notifyOnFeedback ?? true,
      notifyOnQuestion: body.notifyOnQuestion ?? false,
      minSaleValue:     Number(body.minSaleValue ?? 0),
      active:           body.active           ?? true,
    },
  })

  return NextResponse.json(config)
}

// POST — send test notification
export async function POST(_: Request, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const config = await prisma.notificationConfig.findUnique({ where: { clientId: params.clientId } })
  if (!config) return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 })

  const client = await prisma.client.findUnique({ where: { id: params.clientId } })
  const text   = testMsgTemplate(client?.name ?? 'Lojista')

  const result = await sendWhatsApp({
    apiUrl:      config.apiUrl,
    apiKey:      config.apiKey,
    apiInstance: config.apiInstance,
    phoneNumber: config.phoneNumber,
  }, text)

  await prisma.notificationLog.create({
    data: {
      clientId:   params.clientId,
      type:       'test',
      message:    text,
      phoneNumber: config.phoneNumber,
      status:     result.ok ? 'sent' : 'failed',
      error:      result.error ?? null,
    },
  })

  return NextResponse.json({ ok: result.ok, error: result.error })
}
