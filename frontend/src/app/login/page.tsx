"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { EyebrowLeft } from "@/components/eyebrow";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { role } = await login(email, password);
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Email atau password salah.");
      setLoading(false);
    }
  }

  return (
    <AuthShell headline="Masuk dan mulai" accent="bertanya.">
      <EyebrowLeft>Masuk</EyebrowLeft>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
        Selamat datang kembali.
      </h2>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="h-12 w-full rounded-sm2 border border-lavender px-4 text-[15px] text-ink placeholder:text-gray-faint focus:border-blue-deep focus:outline-none focus:ring-2 focus:ring-blue-electric/30"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-ink"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="h-12 w-full rounded-sm2 border border-lavender px-4 text-[15px] text-ink placeholder:text-gray-faint focus:border-blue-deep focus:outline-none focus:ring-2 focus:ring-blue-electric/30"
          />
        </div>

        {error && (
          <p className="rounded-sm2 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="arrow-btn h-12 w-full rounded-md2 bg-blue-deep text-[15px] font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}{" "}
          {!loading && <span className="arrow">→</span>}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray2">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-deep hover:underline"
        >
          Daftar
        </Link>
      </p>
    </AuthShell>
  );
}
