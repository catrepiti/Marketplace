import { Sidebar } from '@/components/layout/Sidebar'
import { prisma } from '@/lib/prisma'

export default async function VendasLayout({ children }: { children: React.ReactNode }) {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar clients={clients} />
      <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col min-h-screen sidebar-transition">
        {children}
      </main>
    </div>
  )
}
