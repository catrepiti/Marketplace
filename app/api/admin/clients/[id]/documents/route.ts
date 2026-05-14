import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return null
  return session
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = join(process.cwd(), 'public', 'uploads', params.id)
  await mkdir(uploadDir, { recursive: true })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `${Date.now()}_${safeName}`
  await writeFile(join(uploadDir, fileName), buffer)

  const doc = await prisma.clientDocument.create({
    data: {
      clientId: params.id,
      name: file.name,
      fileUrl: `/uploads/${params.id}/${fileName}`,
      fileType: file.type,
      fileSize: file.size,
      uploadedBy: (session.user as any)?.name ?? (session.user as any)?.email,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const docId = searchParams.get('docId')
  if (!docId) return NextResponse.json({ error: 'docId obrigatório' }, { status: 400 })

  const doc = await prisma.clientDocument.findFirst({ where: { id: docId, clientId: params.id } })
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  await prisma.clientDocument.delete({ where: { id: docId } })
  return NextResponse.json({ ok: true })
}
