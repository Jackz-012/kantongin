import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function RiwayatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna'

  return (
    <div className="min-h-screen gradient-bg">
      <Sidebar userName={userName} userEmail={user.email} />
      <main className="lg:ml-60 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
