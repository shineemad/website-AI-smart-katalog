"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AiText } from "./ai-text";
import { LogoMark } from "./logo";

interface Message {
  role: "user" | "ai";
  text: string;
}

/**
 * Widget chat AI floating: tombol bulat biru kanan-bawah, membuka panel
 * radius besar. Riwayat disimpan di state sesi. Loading tiga titik,
 * error inline untuk 429/500.
 */
export function ChatWidget({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await api.chatProduct(productId, text);
      setMessages((m) => [...m, { role: "ai", text: res.reply }]);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 429
          ? "Terlalu banyak pertanyaan. Tunggu satu menit lalu coba lagi."
          : "AI sedang tidak bisa dihubungi. Coba beberapa saat lagi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Tombol floating */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Tutup chat AI" : "Buka chat AI"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-deep shadow-lg shadow-blue-deep/25 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <span className="text-2xl leading-none text-white">×</span>
        ) : (
          <LogoMark size={30} />
        )}
      </button>

      {/* Panel chat */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[480px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg2 border border-lavender bg-white shadow-2xl shadow-ink/10">
          <div className="bg-blue-deep px-5 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-blue-sky">
              Tanya AI
            </p>
            <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-white">
              {productName}
            </p>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-bg-soft/60 p-4"
          >
            {messages.length === 0 && !loading && (
              <div className="mt-10 text-center">
                <p className="text-sm font-medium text-ink">
                  Tanyakan apa saja tentang produk ini.
                </p>
                <p className="mt-1.5 px-6 text-xs leading-relaxed text-gray-muted">
                  Contoh: apakah cocok untuk editing video? Kuat berapa jam
                  baterainya?
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-md2 px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto whitespace-pre-line bg-blue-tint text-ink-soft"
                    : "mr-auto border border-lavender bg-white text-ink-soft"
                }`}
              >
                {m.role === "ai" ? <AiText text={m.text} /> : m.text}
              </div>
            ))}
            {loading && (
              <div className="dot-pulse mr-auto flex items-center gap-1.5 rounded-md2 border border-lavender bg-white px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-blue-electric" />
                <span className="h-2 w-2 rounded-full bg-blue-electric" />
                <span className="h-2 w-2 rounded-full bg-blue-electric" />
              </div>
            )}
            {error && (
              <p className="rounded-md2 border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-xs leading-relaxed text-danger">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={send}
            className="flex gap-2 border-t border-lavender bg-white p-3"
          >
            <label htmlFor="chat-input" className="sr-only">
              Pertanyaan
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaanmu"
              maxLength={1000}
              className="h-11 flex-1 rounded-md2 border border-lavender px-3.5 text-sm text-ink placeholder:text-gray-faint focus:border-blue-deep focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 rounded-md2 bg-blue-deep px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </>
  );
}
