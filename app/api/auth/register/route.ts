import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, planId } = body

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado.' }, { status: 400 })
    }

    let plan = null
    if (planId) {
      plan = await prisma.plan.findUnique({ where: { id: planId } })
    }
    if (!plan) {
      plan = await prisma.plan.findFirst({ where: { active: true }, orderBy: { sortOrder: 'asc' } })
    }

    const hashed = await bcrypt.hash(password, 12)
    const slug = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '-')

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        role: 'CLIENT',
        client: {
          create: {
            name: name.trim(),
            slug: `${slug}-${Date.now().toString(36)}`,
            planId: plan?.id,
            trialEndsAt,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true, clientId: true },
    })

    return NextResponse.json({ ok: true, user }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
