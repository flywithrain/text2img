"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, User, Lock, Wand2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "register">("login");
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
      window.dispatchEvent(new Event("steppix:user-refresh"));
      router.push(redirect);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setLoading(null);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-bg-50 pl-10 pr-4 py-3 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-indigo/50 focus:ring-2 focus:ring-brand-indigo/15";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-100 px-4 py-12">
      {/* 顶部 Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-purple shadow-lg shadow-brand-violet/30">
          <Wand2 className="h-5 w-5 text-white" />
        </span>
        <span className="text-xl font-bold tracking-tight text-ink-900">StepPix</span>
      </Link>

      <div className="w-full max-w-[420px] rounded-2xl border border-black/5 bg-white p-8 shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
        <h1 className="mb-6 text-center text-xl font-bold text-ink-900">
          {mode === "login" ? "登录" : "注册"}
        </h1>

        {/* Tab 切换 */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-bg-200 p-1">
          {(["login", "register"] as const).map((m) => (
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
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-400 hover:text-ink-700",
              )}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        {/* 用户名 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-500" htmlFor="auth-username">
            用户名
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
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
        </div>

        {/* 注册才需要邮箱 + 验证码 */}
        {mode === "register" ? (
          <>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink-500" htmlFor="auth-email">
                邮箱
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
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
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink-500" htmlFor="auth-code">
                验证码
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                  <input
                    id="auth-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-xl border border-black/10 bg-bg-50 pl-10 pr-4 py-3 tracking-widest text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-indigo/50 focus:ring-2 focus:ring-brand-indigo/15"
                    placeholder="6 位数字"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 px-4"
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
              {sent ? (
                <p className="mt-1.5 text-xs text-emerald-600">
                  验证码已发送，请查收邮箱（含垃圾箱）
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {/* 密码 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-ink-500" htmlFor="auth-password">
            密码
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
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
        </div>

        {error ? (
          <p className="mb-4 text-sm text-red-600">{error}</p>
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
      </div>

      <Link
        href="/"
        className="mt-6 flex items-center gap-1.5 text-sm text-ink-400 transition hover:text-ink-700"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
