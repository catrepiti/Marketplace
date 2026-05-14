export const dynamic = 'force-dynamic'
import { Sidebar } from '@/components/layout/Sidebar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function VendasLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const clientId = (session?.user as any)?.clientId

  let clients: { id: string; name: string; slug: string }[] = []

  if (role === 'CLIENT' && clientId) {
    const c = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, slug: true },
    })
    if (c) clients = [c]
  } else {
    clients = await prisma.client.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar clients={clients} />
      <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col min-h-screen sidebar-transition">
        {children}
      </main>
    </div>
  )
}
