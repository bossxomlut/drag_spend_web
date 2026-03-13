"use client";

import Link from "next/link";
import { TrendingDown, Clock, Mail, RotateCcw, CalendarX2 } from "lucide-react";
import { useUILanguage } from "@/hooks/useUILanguage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const T = {
  vi: {
    title: "Tài khoản đang chờ xoá",
    subtitle: "Tài khoản và toàn bộ dữ liệu của bạn sẽ bị xoá vĩnh viễn vào:",
    subtitleNoDate:
      "Tài khoản và toàn bộ dữ liệu của bạn sẽ bị xoá vĩnh viễn sau 30 ngày.",
    daysLeft: (n: number) => `Còn ${n} ngày`,
    recoverTitle: "Muốn lấy lại tài khoản?",
    recoverDesc:
      "Nếu bạn thay đổi ý định, hãy liên hệ qua email trước ngày xoá. Chúng tôi sẽ khôi phục tài khoản cho bạn.",
    emailLabel: "Liên hệ:",
    backToLogin: "Quay về trang đăng nhập",
    note: "Nếu bạn đăng nhập lại, tài khoản sẽ KHÔNG tự động được khôi phục. Bạn phải liên hệ qua email.",
  },
  en: {
    title: "Account scheduled for deletion",
    subtitle: "Your account and all its data will be permanently deleted on:",
    subtitleNoDate:
      "Your account and all its data will be permanently deleted after 30 days.",
    daysLeft: (n: number) => `${n} days remaining`,
    recoverTitle: "Changed your mind?",
    recoverDesc:
      "If you want to restore your account, contact us via email before the deletion date. We will recover your account for you.",
    emailLabel: "Contact:",
    backToLogin: "Back to login",
    note: "If you log in again, your account will NOT be automatically restored. You must contact us via email to recover it.",
  },
};

function formatPurgeDate(
  since: string,
  lang: string,
): { date: string; daysLeft: number } {
  const deletedAt = new Date(since);
  const purge = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(
    0,
    Math.ceil((purge.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const date = purge.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return { date, daysLeft };
}

function AccountDeletedContent() {
  const [lang] = useUILanguage();
  const t = T[lang];
  const params = useSearchParams();
  const since = params.get("since");
  const purge = since ? formatPurgeDate(since, lang) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
          <TrendingDown className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl text-slate-800 dark:text-slate-100">
          Drag Spend
        </span>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 dark:bg-orange-950 border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center mb-5">
          <Clock className="w-8 h-8 text-orange-500" />
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
          {t.title}
        </h1>

        {purge ? (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              {t.subtitle}
            </p>
            {/* Purge date card */}
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarX2 className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-bold text-red-700">
                  {purge.date}
                </span>
              </div>
              <span className="text-xs font-semibold text-red-500 bg-red-100 px-2.5 py-1 rounded-full">
                {t.daysLeft(purge.daysLeft)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            {t.subtitleNoDate}
          </p>
        )}

        {/* Recover section */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 text-left mb-6">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-sm font-bold text-indigo-800">
              {t.recoverTitle}
            </h2>
          </div>
          <p className="text-sm text-indigo-700 leading-relaxed mb-3">
            {t.recoverDesc}
          </p>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs text-indigo-600 font-medium">
              {t.emailLabel}
            </span>
            <a
              href="mailto:bossxomlut@gmail.com"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 transition-colors">
              bossxomlut@gmail.com
            </a>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-6 px-2">
          {t.note}
        </p>

        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center w-full gap-2 bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm">
          {t.backToLogin}
        </Link>
      </div>
    </div>
  );
}

export default function AccountDeletedPage() {
  return (
    <Suspense>
      <AccountDeletedContent />
    </Suspense>
  );
}
