"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { QueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { TrendingDown } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUILanguage } from "@/hooks/useUILanguage";

const T = {
  vi: {
    subtitle: "Quản lý thu chi thông minh",
    heading: "Đăng nhập",
    password: "Mật khẩu",
    submit: "Đăng nhập",
    submitting: "Đang đăng nhập...",
    noAccount: "Chưa có tài khoản?",
    register: "Đăng ký",
    forgotPassword: "Quên mật khẩu?",
  },
  en: {
    subtitle: "Smart expense tracking",
    heading: "Sign in",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in...",
    noAccount: "Don't have an account?",
    register: "Register",
    forgotPassword: "Forgot password?",
  },
};

export default function LoginPage() {
  const [lang] = useUILanguage();
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const queryClient = new QueryClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("deleted_at")
        .eq("id", data.user.id)
        .single();

      if (profile?.deleted_at) {
        await supabase.auth.signOut();
        router.push(
          `/account/deleted?since=${encodeURIComponent(profile.deleted_at)}`,
        );
      } else {
        queryClient.prefetchQuery({
          queryKey: ["initial-dashboard"],
          queryFn: async () => {
            const [profileRes, categoriesRes, cardsRes] = await Promise.all([
              supabase.from("profiles").select("*").eq("id", data.user.id).single(),
              supabase.from("categories").select("*").order("type").order("name"),
              supabase.from("spending_cards").select("*, category:categories(*), variants:card_variants(*)").eq("user_id", data.user.id).order("use_count", { ascending: false }).order("position"),
            ]);
            return {
              profile: profileRes.data,
              categories: categoriesRes.data || [],
              cards: cardsRes.data || [],
            };
          },
        });
        queryClient.prefetchQuery({
          queryKey: ["transactions", new Date().toISOString().slice(0, 10)],
          queryFn: async () => {
            const { data } = await supabase.from("transactions").select("*, category:categories(*)").eq("date", new Date().toISOString().slice(0, 10)).order("position");
            return data || [];
          },
        });
        router.push("/dashboard");
        router.refresh();
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white mb-2">
            <div className="bg-indigo-500 rounded-xl p-2">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">Drag Spend</span>
          </div>
          <p className="text-slate-400 text-sm">{t.subtitle}</p>
          <div className="flex justify-center mt-3">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
            {t.heading}
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.submitting : t.submit}
            </Button>
          </form>
          <div className="flex justify-center mt-3">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {t.forgotPassword}
            </Link>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
            {t.noAccount}{" "}
            <Link
              href="/auth/register"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
