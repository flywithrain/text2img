"use client";

import { useEffect, useState } from "react";
import { Mail, X, Loader2, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "login" | "register";

export function LoginModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState<"send" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!open) {
      setUsername("");
      setEmail("");
      setCode("");
      setPassword("");
      setSent(false);
      setError(null);
      setLoading(null);
    }
  }, [open]);

  if (!open) return null;

  async function sendCode() {
    setError(null);
    setLoading("send");
    try {
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发送失败");
      setSent(true);
      setCooldown(json.cooldownSec ?? 60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(null);
    }
  }

  async function submit() {
    setError(null);
    setLoading("submit");
    try {
      const isRegister = mode === "register";
      const res = await fetch(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister
              ? { username: username.trim(), password, email: email.trim(), code: code.trim() }
              : { username: username.trim(), password },
          ),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || (isRegister ? "注册失败" : "登录失败"));
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setLoading(null);
    }
  }

  const inputCls = cn("glass-input pl-10");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-900/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#F4F4F8]">
            {mode === "login" ? "登录 StepPix" : "注册 StepPix"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#C7C7D1] transition hover:bg-white/10 hover:text-white"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition",
                mode === m
                  ? "bg-brand-violet/30 text-[#F4F4F8]"
                  : "text-[#C7C7D1] hover:text-white",
              )}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <label className="label-text" htmlFor="auth-username">
          用户名
        </label>
        <div className="relative mb-3">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C7C7D1]/50" />
          <input
            id="auth-username"
            type="text"
            className={inputCls}
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        {mode === "register" ? (
          <>
            <label className="label-text" htmlFor="auth-email">
              邮箱
            </label>
            <div className="mb-3 flex gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C7C7D1]/50" />
                <input
                  id="auth-email"
                  type="email"
                  className={inputCls}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <Button
                variant="outline"
                className="shrink-0 px-3"
                disabled={!email.trim() || cooldown > 0 || loading === "send"}
                onClick={sendCode}
              >
                {loading === "send" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : cooldown > 0 ? (
                  `${cooldown}s`
                ) : (
                  "获取验证码"
                )}
              </Button>
            </div>

            <label className="label-text" htmlFor="auth-code">
              验证码
            </label>
            <input
              id="auth-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="glass-input mb-3 tracking-widest"
              placeholder="6 位数字"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {sent ? (
              <p className="mb-3 text-xs text-emerald-300/80">
                验证码已发送，请查收邮箱（含垃圾箱）
              </p>
            ) : null}
          </>
        ) : null}

        <label className="label-text" htmlFor="auth-password">
          密码
        </label>
        <div className="relative mb-4">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C7C7D1]/50" />
          <input
            id="auth-password"
            type="password"
            className={inputCls}
            placeholder={mode === "register" ? "至少 6 位" : "请输入密码"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error ? (
          <p className="mb-3 text-sm text-red-300">{error}</p>
        ) : null}

        <Button
          className="w-full"
          variant="primary"
          disabled={
            !username.trim() || !password || loading === "submit" ||
            (mode === "register" && (!email.trim() || code.length !== 6))
          }
          onClick={submit}
        >
          {loading === "submit" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> 处理中…
            </>
          ) : mode === "login" ? (
            "登录"
          ) : (
            "注册"
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-[#C7C7D1]/50">
          新用户注册即送 20 次生图机会 · 每日签到可再领 10–20 次
        </p>
      </div>
    </div>
  );
}
