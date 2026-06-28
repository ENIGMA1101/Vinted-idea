import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-60">
        <TopBar />
        <main className="flex-1 px-6 py-8 pt-24">{children}</main>
      </div>
    </div>
  )
}
