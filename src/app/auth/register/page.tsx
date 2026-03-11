"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
    heading: "Tạo tài khoản",
    name: "Tên của bạn",
    namePlaceholder: "Nguyễn Văn A",
    password: "Mật khẩu",
    passwordPlaceholder: "Tối thiểu 6 ký tự",
    submit: "Đăng ký",
    submitting: "Đang tạo...",
    hasAccount: "Đã có tài khoản?",
    login: "Đăng nhập",
    successMsg: "Đăng ký thành công! Đang chuyển hướng...",
  },
  en: {
    subtitle: "Smart expense tracking",
    heading: "Create account",
    name: "Your name",
    namePlaceholder: "John Doe",
    password: "Password",
    passwordPlaceholder: "At least 6 characters",
    submit: "Register",
    submitting: "Creating...",
    hasAccount: "Already have an account?",
    login: "Sign in",
    successMsg: "Account created! Redirecting...",
  },
};

export default function RegisterPage() {
  const [lang] = useUILanguage();
  const t = T[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.successMsg);
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
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

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-semibold text-slate-800 mb-6">
            {t.heading}
          </h1>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.submitting : t.submit}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            {t.hasAccount}{" "}
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:underline font-medium">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
