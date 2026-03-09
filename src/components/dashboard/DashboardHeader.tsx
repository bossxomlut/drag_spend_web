"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrendingDown, LogOut } from "lucide-react";
import { toast } from "sonner";

export function DashboardHeader() {
  const router = useRouter();
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Đã đăng xuất");
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="h-12 lg:h-14 bg-slate-900 text-white flex items-center justify-between px-3 lg:px-4 flex-shrink-0 shadow-md">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-500 rounded-lg p-1.5">
          <TrendingDown className="w-4 h-4" />
        </div>
        <span className="font-bold text-base lg:text-lg tracking-tight">
          Drag Spend
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2 lg:px-3"
        onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Đăng xuất</span>
      </Button>
    </header>
  );
}
