"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Loader2,
  LogIn,
  Boxes,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth-button";
import type { ModelProvider } from "@/lib/types";

interface AdminModel {
  id: string;
  name: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface FormState {
  name: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  provider: "openai",
  model: "",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  enabled: true,
  isDefault: false,
};

/** 常用模型预设，一键填充 provider / 模型标识 / API 地址 */
const PRESETS: {
  label: string;
  form: Omit<FormState, "name" | "apiKey" | "enabled" | "isDefault">;
}[] = [
  {
    label: "Grok (xAI)",
    form: {
      provider: "openai",
      model: "grok-2-image",
      baseUrl: "https://api.x.ai/v1",
    },
  },
  {
    label: "GPT Image (OpenAI)",
    form: {
      provider: "openai",
      model: "gpt-image-1",
      baseUrl: "https://api.openai.com/v1",
    },
  },
  {
    label: "Gemini",
    form: {
      provider: "gemini",
      model: "gemini-2.5-flash-image",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    },
  },
  {
    label: "StepFun",
    form: {
      provider: "stepfun",
      model: "step-image-edit-2",
      baseUrl: "https://api.stepfun.com/step_plan/v1",
    },
  },
];

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: "OpenAI 兼容（Grok / GPT 等）",
  gemini: "Google Gemini",
  stepfun: "StepFun 风格（全参数）",
};

export default function ModelAdminPage() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<AdminModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null); // null=新增关闭
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/models", { cache: "no-store" });
      if (res.status === 403 || res.status === 401) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载失败");
      setModels(json.items ?? []);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
    setError(null);
  }

  function openEdit(m: AdminModel) {
    setEditingId(m.id);
    setForm({
      name: m.name,
      provider: m.provider,
      model: m.model,
      baseUrl: m.baseUrl,
      apiKey: "",
      enabled: m.enabled,
      isDefault: m.isDefault,
    });
    setFormOpen(true);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function save() {
    if (!form.name.trim() || !form.model.trim() || !form.baseUrl.trim()) {
      setError("请填写模型名称、模型标识和 API 地址");
      return;
    }
    if (!editingId && !form.apiKey.trim()) {
      setError("请填写 API Key");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        editingId ? `/api/admin/models/${editingId}` : "/api/admin/models",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            provider: form.provider,
            model: form.model.trim(),
            baseUrl: form.baseUrl.trim(),
            apiKey: form.apiKey.trim() || undefined,
            enabled: form.enabled,
            isDefault: form.isDefault,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      closeForm();
      await load();
    } catch (e: any) {
      setError(e?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`确定删除模型「${name}」？删除后用户将无法再选择该模型。`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "删除失败");
      await load();
    } catch (e: any) {
      setError(e?.message || "删除失败");
    }
  }

  async function toggleEnabled(m: AdminModel) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/models/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: m.name,
          provider: m.provider,
          model: m.model,
          baseUrl: m.baseUrl,
          enabled: !m.enabled,
          isDefault: m.isDefault,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "操作失败");
      await load();
    } catch (e: any) {
      setError(e?.message || "操作失败");
    }
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-bg-100">
        <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
            <span className="font-bold">模型管理</span>
            <AuthButton />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
          <GlassCard className="text-center">
            <LogIn className="mx-auto mb-4 h-10 w-10 text-ink-300" />
            <p className="mb-4 text-ink-500">无权限访问，仅管理员可查看</p>
            <Link href="/">
              <Button variant="primary">返回首页</Button>
            </Link>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-100">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-black/5 bg-bg-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-ink-900">
              <ArrowLeft className="h-4 w-4" /> 返回
            </Link>
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-sky to-brand-meadow">
                <Boxes className="h-4 w-4 text-white" />
              </span>
              <span className="font-bold">模型管理</span>
            </span>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-sky" />
          </div>
        ) : (
          <>
            {/* 新增/编辑表单 */}
            {formOpen ? (
              <GlassCard className="mb-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink-900">
                    {editingId ? "编辑模型" : "新增模型"}
                  </h2>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded p-1 text-ink-400 transition hover:bg-bg-100 hover:text-ink-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {!editingId ? (
                  <div className="mb-4">
                    <p className="mb-2 text-xs text-ink-400">常用预设（点击填充）：</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, ...p.form }))
                          }
                          className="rounded-lg border border-brand-sky/30 bg-brand-sky/5 px-2.5 py-1.5 text-xs font-medium text-brand-sky transition hover:bg-brand-sky/15"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-500">
                      模型名称（用户可见）
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="如：Grok 图像"
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-500">
                      接口类型
                    </label>
                    <select
                      value={form.provider}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          provider: e.target.value as ModelProvider,
                        }))
                      }
                      className="glass-input"
                    >
                      {(Object.keys(PROVIDER_LABELS) as ModelProvider[]).map((p) => (
                        <option key={p} value={p}>
                          {PROVIDER_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-500">
                      模型标识（model）
                    </label>
                    <input
                      value={form.model}
                      onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                      placeholder="如 grok-2-image"
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-500">
                      API 地址（baseUrl）
                    </label>
                    <input
                      value={form.baseUrl}
                      onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                      placeholder="https://api.x.ai/v1"
                      className="glass-input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-ink-500">
                      API Key{editingId ? "（留空则不修改）" : ""}
                    </label>
                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                      placeholder={editingId ? "••••••••" : "服务商提供的密钥"}
                      className="glass-input"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex items-center gap-6 sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={form.enabled}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, enabled: e.target.checked }))
                        }
                        className="h-4 w-4 accent-[#0EA5E9]"
                      />
                      启用
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, isDefault: e.target.checked }))
                        }
                        className="h-4 w-4 accent-[#0EA5E9]"
                      />
                      设为默认模型
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" className="h-9" onClick={closeForm}>
                    取消
                  </Button>
                  <Button variant="primary" className="h-9" onClick={save} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    保存
                  </Button>
                </div>
              </GlassCard>
            ) : (
              <div className="mb-4 flex justify-end">
                <Button variant="primary" className="h-9" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  新增模型
                </Button>
              </div>
            )}

            <GlassCard>
              <h2 className="mb-4 text-sm font-semibold text-ink-900">
                模型列表（{models.length}）
              </h2>
              {models.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-400">
                  暂未配置模型。未配置时将回退到服务端环境变量中的默认模型。
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/5 text-left text-xs text-ink-400">
                        <th className="pb-2 pr-4 font-medium">名称</th>
                        <th className="pb-2 pr-4 font-medium">接口类型</th>
                        <th className="pb-2 pr-4 font-medium">模型标识</th>
                        <th className="pb-2 pr-4 font-medium">API 地址</th>
                        <th className="pb-2 pr-4 font-medium">密钥</th>
                        <th className="pb-2 pr-4 font-medium">状态</th>
                        <th className="pb-2 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((m) => (
                        <tr key={m.id} className="border-b border-black/5 last:border-0 hover:bg-bg-50">
                          <td className="py-3 pr-4">
                            <span className="font-medium text-ink-900">{m.name}</span>
                            {m.isDefault ? (
                              <span className="ml-1.5 rounded bg-brand-meadow/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-meadow">
                                默认
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 pr-4 text-xs text-ink-500">
                            {PROVIDER_LABELS[m.provider] ?? m.provider}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-ink-500">
                            {m.model}
                          </td>
                          <td className="max-w-[12rem] truncate py-3 pr-4 text-xs text-ink-400" title={m.baseUrl}>
                            {m.baseUrl}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-ink-400">
                            {m.apiKeyMasked}
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              type="button"
                              onClick={() => toggleEnabled(m)}
                              className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                                m.enabled
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  : "bg-bg-200 text-ink-400 hover:bg-bg-300"
                              }`}
                            >
                              {m.enabled ? "已启用" : "已停用"}
                            </button>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(m)}
                                className="rounded p-1.5 text-ink-400 transition hover:bg-bg-100 hover:text-brand-sky"
                                title="编辑"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(m.id, m.name)}
                                className="rounded p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>

            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              提示：API Key 仅保存在服务端数据库，不会下发给浏览器。用户生图时按所选模型调用对应接口；
              历史记录会保存生成时使用的模型名称。未配置任何模型时，系统回退使用服务端环境变量
              IMAGE_API_* 指定的默认模型。
            </p>
          </>
        )}
      </main>
    </div>
  );
}
