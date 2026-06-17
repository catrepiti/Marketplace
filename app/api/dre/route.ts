import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const EXPENSE_CATEGORIES = {
  COMISSAO: 'Comissões de Marketplace',
  CPV: 'Custo dos Produtos Vendidos',
  FRETE: 'Frete e Logística',
  IMPOSTO: 'Impostos',
  ADMINISTRATIVO: 'Despesas Administrativas',
  MARKETING: 'Marketing e Publicidade',
  FINANCEIRO: 'Despesas Financeiras',
  OUTRO: 'Outras Despesas',
} as const

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const role = (session.user as any)?.role
  const userId = (session.user as any)?.id

  let clientId = searchParams.get('clientId')
  if (role === 'CLIENT' || !clientId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { clientId: true } })
    clientId = user?.clientId ?? null
  }

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to dates required' }, { status: 400 })
  }

  const dateFrom = new Date(from)
  const dateTo = new Date(to + 'T23:59:59.999Z')

  const [sales, expenses, client] = await Promise.all([
    prisma.sale.findMany({
      where: {
        clientId,
        saleDate: { gte: dateFrom, lte: dateTo },
        status: { in: ['paid', 'delivered', 'closed'] },
      },
    }),
    prisma.expense.findMany({
      where: {
        clientId,
        date: { gte: dateFrom, lte: dateTo },
      },
    }),
    prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true },
    }),
  ])

  const receitaBruta = sales.reduce((sum, s) => sum + s.totalPrice, 0)
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0)

  const expensesByCategory: Record<string, { label: string; total: number; items: typeof expenses }> = {}
  for (const cat of Object.keys(EXPENSE_CATEGORIES)) {
    const catExpenses = expenses.filter(e => e.category === cat)
    const total = catExpenses.reduce((sum, e) => sum + e.amount, 0)
    if (total > 0 || catExpenses.length > 0) {
      expensesByCategory[cat] = {
        label: EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES],
        total,
        items: catExpenses,
      }
    }
  }

  const deducoes = (expensesByCategory.COMISSAO?.total ?? 0) +
                   (expensesByCategory.IMPOSTO?.total ?? 0)
  const receitaLiquida = receitaBruta - deducoes

  const cpv = expensesByCategory.CPV?.total ?? 0
  const frete = expensesByCategory.FRETE?.total ?? 0
  const lucroBruto = receitaLiquida - cpv - frete

  const despesasOperacionais =
    (expensesByCategory.ADMINISTRATIVO?.total ?? 0) +
    (expensesByCategory.MARKETING?.total ?? 0) +
    (expensesByCategory.OUTRO?.total ?? 0)

  const despesasFinanceiras = expensesByCategory.FINANCEIRO?.total ?? 0

  const resultadoOperacional = lucroBruto - despesasOperacionais
  const resultadoLiquido = resultadoOperacional - despesasFinanceiras

  const margemBruta = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0
  const margemLiquida = receitaBruta > 0 ? (resultadoLiquido / receitaBruta) * 100 : 0

  const salesByMarketplace: Record<string, number> = {}
  for (const s of sales) {
    salesByMarketplace[s.marketplace] = (salesByMarketplace[s.marketplace] ?? 0) + s.totalPrice
  }

  const salesByMonth: Record<string, number> = {}
  for (const s of sales) {
    const month = s.saleDate.toISOString().slice(0, 7)
    salesByMonth[month] = (salesByMonth[month] ?? 0) + s.totalPrice
  }

  return NextResponse.json({
    clientName: client?.name ?? '',
    period: { from, to },
    summary: {
      totalSales: sales.length,
      totalQuantity,
      receitaBruta: +receitaBruta.toFixed(2),
      deducoes: +deducoes.toFixed(2),
      receitaLiquida: +receitaLiquida.toFixed(2),
      cpv: +cpv.toFixed(2),
      frete: +frete.toFixed(2),
      lucroBruto: +lucroBruto.toFixed(2),
      despesasOperacionais: +despesasOperacionais.toFixed(2),
      despesasFinanceiras: +despesasFinanceiras.toFixed(2),
      resultadoOperacional: +resultadoOperacional.toFixed(2),
      resultadoLiquido: +resultadoLiquido.toFixed(2),
      margemBruta: +margemBruta.toFixed(1),
      margemLiquida: +margemLiquida.toFixed(1),
    },
    expensesByCategory,
    salesByMarketplace,
    salesByMonth,
    categories: EXPENSE_CATEGORIES,
  })
}
