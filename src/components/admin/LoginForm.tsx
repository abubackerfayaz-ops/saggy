"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Login failed");
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="block text-[10px] font-label uppercase tracking-widest text-neutral-400 mb-1.5">
          Password
        </span>
        <div className="relative">
          <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full h-12 bg-[#0d0c10] border border-white/10 rounded-xl pl-10 pr-11 text-sm text-white placeholder:text-neutral-600 font-body outline-none focus:border-[#FF2D88]/60 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </label>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!password || submitting}
        className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] hover:brightness-110 text-white font-cta font-bold text-sm tracking-widest uppercase rounded-2xl transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_20px_rgba(255,45,136,0.35)]"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Enter Dashboard</span>
          </>
        )}
      </button>
    </form>
  );
}
