'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TrendingDown, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export function DashboardHeader() {
  const router = useRouter()
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Đã đăng xuất')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 flex-shrink-0 shadow-md">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-500 rounded-lg p-1.5">
          <TrendingDown className="w-4 h-4" />
        </div>
        <span className="font-bold text-lg tracking-tight">Drag Spend</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-400 hover:text-white hover:bg-slate-800"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-1" />
        Đăng xuất
      </Button>
    </header>
  )
}
