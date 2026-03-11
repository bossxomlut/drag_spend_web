"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { TrendingDown, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { DashboardLanguageSwitcher } from "@/components/dashboard/DashboardLanguageSwitcher";
import { useDashboardT } from "@/hooks/useDashboardT";

export function DashboardHeader() {
  const router = useRouter();
  const t = useDashboardT();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.name ?? null);
        setUserEmail(user.email ?? null);
      }
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Đã đăng xuất");
    router.push("/auth/login");
    router.refresh();
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

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

      <div className="flex items-center gap-2">
        <DashboardLanguageSwitcher />
        {/* User info popover */}
        <Popover>
          <PopoverTrigger className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 rounded-full flex items-center justify-center transition-colors">
            {userName ? (
              <span className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[11px] font-bold text-white">
                {initials}
              </span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="end">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                {userName && (
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {userName}
                  </p>
                )}
                {userEmail && (
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                )}
              </div>
            </div>
            <Separator className="mb-2" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              {t.logout}
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
