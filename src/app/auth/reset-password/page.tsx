"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { TrendingDown, KeyRound, AlertCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUILanguage } from "@/hooks/useUILanguage";

const T = {
  vi: {
    subtitle: "Quản lý thu chi thông minh",
    heading: "Đặt lại mật khẩu",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu mới",
    passwordPlaceholder: "Tối thiểu 6 ký tự",
    submit: "Cập nhật mật khẩu",
    submitting: "Đang cập nhật...",
    successMsg: "Mật khẩu đã được cập nhật!",
    mismatch: "Mật khẩu xác nhận không khớp.",
    expiredHeading: "Link đã hết hạn",
    expiredDesc:
      "Link đặt lại mật khẩu của bạn đã hết hạn hoặc không hợp lệ. Hãy yêu cầu link mới.",
    requestNew: "Yêu cầu link mới",
    checkingSession: "Đang xác thực...",
  },
  en: {
    subtitle: "Smart expense tracking",
    heading: "Reset password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordPlaceholder: "At least 6 characters",
    submit: "Update password",
    submitting: "Updating...",
    successMsg: "Password updated!",
    mismatch: "Passwords do not match.",
    expiredHeading: "Link expired",
    expiredDesc:
      "Your password reset link has expired or is invalid. Please request a new one.",
    requestNew: "Request new link",
    checkingSession: "Verifying...",
  },
} as const;

export default function ResetPasswordPage() {
  const [lang] = useUILanguage();
  const t = T[lang];
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  // null = checking, true = valid recovery session, false = no session
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t.mismatch);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
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
          {hasSession === null ? (
            /* Checking session */
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !hasSession ? (
            /* No session — link expired or already used */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 dark:bg-red-900/40 rounded-full p-4">
                  <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                {t.expiredHeading}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {t.expiredDesc}
              </p>
              <Link href="/auth/forgot-password">
                <Button className="w-full">{t.requestNew}</Button>
              </Link>
            </div>
          ) : (
            /* Valid session — show reset form */
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-full p-3">
                  <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
                {t.heading}
              </h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t.newPassword}</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="confirm">{t.confirmPassword}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder={t.passwordPlaceholder}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t.submitting : t.submit}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
