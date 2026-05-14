import { ClientSidebar } from '@/components/layout/ClientSidebar'

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ClientSidebar />
      <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col min-h-screen sidebar-transition">
        {children}
      </main>
    </div>
  )
}
