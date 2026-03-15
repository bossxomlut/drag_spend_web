"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { TrendingDown, Mail, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUILanguage } from "@/hooks/useUILanguage";

const T = {
  vi: {
    subtitle: "Quản lý thu chi thông minh",
    heading: "Quên mật khẩu?",
    description:
      "Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.",
    emailLabel: "Email",
    submit: "Gửi link đặt lại",
    submitting: "Đang gửi...",
    backToLogin: "Quay lại đăng nhập",
    sentHeading: "Kiểm tra email của bạn",
    sentDesc: (email: string) =>
      `Chúng tôi đã gửi link đặt lại mật khẩu đến ${email}.`,
    sentNote: "Không thấy email? Kiểm tra thư mục spam nhé.",
    sentBack: "Quay lại đăng nhập",
  },
  en: {
    subtitle: "Smart expense tracking",
    heading: "Forgot password?",
    description:
      "Enter the email you used to register. We'll send you a password reset link.",
    emailLabel: "Email",
    submit: "Send reset link",
    submitting: "Sending...",
    backToLogin: "Back to sign in",
    sentHeading: "Check your email",
    sentDesc: (email: string) => `We sent a password reset link to ${email}.`,
    sentNote: "Can't find it? Check your spam folder.",
    sentBack: "Back to sign in",
  },
} as const;

export default function ForgotPasswordPage() {
  const [lang] = useUILanguage();
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
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
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-full p-4">
                  <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                {t.sentHeading}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                {t.sentDesc(email)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                {t.sentNote}
              </p>
              <Link
                href="/auth/login"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                {t.sentBack}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t.heading}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t.description}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t.submitting : t.submit}
                </Button>
              </form>
              <div className="flex justify-center mt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t.backToLogin}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
