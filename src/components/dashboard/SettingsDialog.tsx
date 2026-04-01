"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardT } from "@/hooks/useDashboardT";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, KeyRound, Globe, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { syncLangToURL } from "@/hooks/useUILanguage";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string | null;
  onOpenDeleteAccount: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  initialName,
  onOpenDeleteAccount,
}: Props) {
  const t = useDashboardT();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  async function handleSwitchLanguage(lang: string) {
    if (lang === language) return;
    setLanguage(lang);
    localStorage.setItem("ui_language", lang);
    syncLangToURL(lang as "vi" | "en");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ language: lang })
        .eq("id", user.id);
    }
  }

  // ── Profile section ──
  const [name, setName] = useState(initialName ?? "");
  const [nameError, setNameError] = useState<string | undefined>();
  const [savingName, setSavingName] = useState(false);

  function validateName(v: string) {
    const err = v.trim() ? undefined : t.settingsNameRequired;
    setNameError(err);
    return !err;
  }

  async function handleSaveName() {
    if (!validateName(name)) return;
    setSavingName(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim() },
      });
      if (error) throw error;
      toast.success(t.settingsNameSaved);
    } catch {
      toast.error(t.settingsPasswordWrong);
    } finally {
      setSavingName(false);
    }
  }

  // ── Password section ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | undefined>();
  const [savingPw, setSavingPw] = useState(false);

  function validatePassword(): string | undefined {
    if (newPw.length < 6) return t.settingsPasswordTooShort;
    if (newPw !== confirmPw) return t.settingsPasswordMismatch;
    return undefined;
  }

  async function handleSavePassword() {
    if (!currentPw.trim()) {
      setPwError(t.settingsNameRequired);
      return;
    }
    const err = validatePassword();
    if (err) {
      setPwError(err);
      return;
    }
    setPwError(undefined);
    setSavingPw(true);
    try {
      const supabase = createClient();
      // Re-authenticate with current password first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("no email");
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signInErr) {
        setPwError(t.settingsPasswordWrong);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPw,
      });
      if (updateErr) throw updateErr;
      toast.success(t.settingsPasswordSaved);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      toast.error(t.settingsPasswordWrong);
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          // Reset password fields on close
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
          setPwError(undefined);
          setNameError(undefined);
        }
        onOpenChange(v);
      }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.settingsTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-1">
          {/* ── Profile ── */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              <User className="w-4 h-4" />
              {t.settingsProfile}
            </h3>
            <div className="space-y-1.5">
              <Label>{t.settingsDisplayName}</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateName(e.target.value);
                }}
                onBlur={() => validateName(name)}
                placeholder={t.settingsDisplayNamePlaceholder}
                className={cn(
                  nameError && "border-red-400 dark:border-red-500",
                )}
              />
              {nameError && (
                <p className="text-[11px] text-red-500 dark:text-red-400">
                  {nameError}
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="mt-3"
              disabled={savingName}
              onClick={handleSaveName}>
              {savingName ? t.saving : t.settingsSaveName}
            </Button>
          </section>

          <Separator />

          {/* ── Password ── */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              <KeyRound className="w-4 h-4" />
              {t.settingsPassword}
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t.settingsCurrentPassword}</Label>
                <Input
                  type="password"
                  value={currentPw}
                  onChange={(e) => {
                    setCurrentPw(e.target.value);
                    if (pwError) setPwError(undefined);
                  }}
                  placeholder={t.settingsPasswordPlaceholder}
                  className={cn(
                    pwError === t.settingsPasswordWrong &&
                      "border-red-400 dark:border-red-500",
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.settingsNewPassword}</Label>
                <Input
                  type="password"
                  value={newPw}
                  onChange={(e) => {
                    setNewPw(e.target.value);
                    if (pwError) setPwError(undefined);
                  }}
                  placeholder={t.settingsPasswordPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.settingsConfirmPassword}</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => {
                    setConfirmPw(e.target.value);
                    if (pwError) setPwError(undefined);
                  }}
                  placeholder={t.settingsPasswordPlaceholder}
                  className={cn(
                    pwError === t.settingsPasswordMismatch &&
                      "border-red-400 dark:border-red-500",
                  )}
                />
              </div>
              {pwError && (
                <p className="text-[11px] text-red-500 dark:text-red-400">
                  {pwError}
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="mt-3"
              disabled={savingPw || !currentPw || !newPw || !confirmPw}
              onClick={handleSavePassword}>
              {savingPw ? t.saving : t.settingsSavePassword}
            </Button>
          </section>

          <Separator />

          {/* ── Language ── */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              <Globe className="w-4 h-4" />
              {t.settingsLanguage}
            </h3>
            <div className="flex gap-2">
              {([
                { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
                { code: "en", flag: "🇺🇸", label: "English" },
              ] as const).map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSwitchLanguage(opt.code)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                    language === opt.code
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600",
                  )}>
                  <span className="text-lg leading-none">{opt.flag}</span>
                  <span>{opt.label}</span>
                  {language === opt.code && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* ── Danger zone ── */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
              <Trash2 className="w-4 h-4" />
              {t.settingsDangerZone}
            </h3>
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                {t.deleteAccountDesc}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenDeleteAccount();
                }}>
                {t.deleteAccount}
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
