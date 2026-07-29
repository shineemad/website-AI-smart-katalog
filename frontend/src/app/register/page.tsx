"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { EyebrowLeft } from "@/components/eyebrow";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.register(name, email, password);
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? "Email sudah terdaftar atau data tidak valid."
          : "Registrasi gagal. Coba beberapa saat lagi.",
      );
      setLoading(false);
    }
  }

  return (
    <AuthShell headline="Buat akun" accent="gratis.">
      <EyebrowLeft>Daftar</EyebrowLeft>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
        Mulai dalam satu menit.
      </h2>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Nama
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            className="h-12 w-full rounded-sm2 border border-lavender px-4 text-[15px] text-ink placeholder:text-gray-faint focus:border-blue-deep focus:outline-none focus:ring-2 focus:ring-blue-electric/30"
          />
        </div>
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
            minLength={6}
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
          {loading ? "Memproses..." : "Daftar"}{" "}
          {!loading && <span className="arrow">→</span>}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray2">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-deep hover:underline"
        >
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
