"use client";

import { useEffect, useState } from "react";

/**
 * Preloader ala referensi: overlay putih dengan counter LOADING 0-100%
 * (font mono), fade-out setelah selesai. Hanya tampil sekali per sesi.
 */
export function Preloader() {
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("katalis_loaded")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("katalis_loaded", "1");
      return;
    }
    setGone(false);
    let n = 0;
    const timer = setInterval(() => {
      n += Math.max(1, Math.round((100 - n) / 8));
      if (n >= 100) {
        n = 100;
        clearInterval(timer);
        sessionStorage.setItem("katalis_loaded", "1");
        setTimeout(() => setGone(true), 450);
      }
      setCount(n);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-end justify-between bg-white px-6 pb-6 transition-opacity duration-500 md:px-12 md:pb-10 ${
        count >= 100 ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-gray-muted">
        Loading
      </span>
      <span className="font-display text-7xl font-medium tracking-tighter text-ink md:text-9xl">
        {count}
        <span className="text-blue-deep">%</span>
      </span>
    </div>
  );
}
