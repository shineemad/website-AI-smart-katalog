"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { List, X } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./logo";

/**
 * Navbar satu baris (68px): bar putih menyatu dengan hero di puncak halaman,
 * berubah jadi glass pill saat scroll, sembunyi saat scroll turun.
 * Di bawah md, navigasi pindah ke menu full-screen dengan line-mask reveal
 * (bahasa motion yang sama dengan headline hero).
 */
export function Navbar() {
  const { token, role, email, ready, logout } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      let readyObserver: MutationObserver | null = null;
      const cleanups: Array<() => void> = [];

      const context = gsap.context(() => {
        const nav = header.querySelector<HTMLElement>("[data-nav-shell]");
        const logo = header.querySelector<HTMLElement>("[data-nav-logo]");
        const links = gsap.utils.toArray<HTMLElement>(
          header.querySelectorAll("[data-nav-section]"),
        );
        const action = header.querySelector<HTMLElement>("[data-nav-action]");
        const menuBtn = gsap.utils.toArray<HTMLElement>(
          header.querySelectorAll("[data-nav-menu]"),
        );

        if (!nav || !logo || !action) return;

        let entryPlayed = false;
        const playEntry = () => {
          if (entryPlayed) return;
          entryPlayed = true;

          gsap
            .timeline({ defaults: { ease: "power4.out" } })
            .fromTo(
              logo,
              { x: -18, autoAlpha: 0 },
              { x: 0, autoAlpha: 1, duration: 0.75 },
            )
            .fromTo(
              links,
              { y: -12, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.62,
                stagger: 0.07,
              },
              "-=0.52",
            )
            .fromTo(
              action,
              { scale: 0.92, autoAlpha: 0 },
              { scale: 1, autoAlpha: 1, duration: 0.72 },
              "-=0.48",
            )
            .fromTo(
              menuBtn,
              { scale: 0.9, autoAlpha: 0 },
              { scale: 1, autoAlpha: 1, duration: 0.6 },
              "-=0.55",
            );
        };

        const root = document.documentElement;
        if (root.dataset.katalisReady === "true") {
          playEntry();
        } else {
          readyObserver = new MutationObserver(() => {
            if (root.dataset.katalisReady === "true") {
              readyObserver?.disconnect();
              playEntry();
            }
          });
          readyObserver.observe(root, {
            attributes: true,
            attributeFilter: ["data-katalis-ready"],
          });
        }

        const navHeight = nav.getBoundingClientRect().height;
        const moveHeader = gsap.quickTo(header, "y", {
          duration: 0.62,
          ease: "power4.out",
        });
        let currentState: "full" | "compact" | "hidden" | null = null;

        const setHeaderState = (nextState: "full" | "compact" | "hidden") => {
          if (currentState === nextState) return;
          currentState = nextState;
          header.dataset.navState = nextState;

          /* +48 agar bayangan glass pill ikut keluar dari viewport */
          moveHeader(nextState === "hidden" ? -(navHeight + 48) : 0);
        };

        setHeaderState(window.scrollY > 24 ? "compact" : "full");

        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const scrollPosition = self.scroll();
            if (scrollPosition <= 24) {
              setHeaderState("full");
            } else if (self.direction > 0 && scrollPosition > 120) {
              setHeaderState("hidden");
            } else if (self.direction < 0) {
              setHeaderState("compact");
            }
          },
        });

        let activeSection: string | null = null;
        const setActiveSection = (sectionId: string | null) => {
          activeSection = sectionId;
          links.forEach((link) => {
            const active = link.dataset.navSection === sectionId;
            const underline = link.querySelector<HTMLElement>(
              "[data-nav-underline]",
            );
            if (!underline) return;

            if (active) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
            gsap.to(underline, {
              scaleX: active ? 1 : 0,
              autoAlpha: active ? 1 : 0,
              duration: 0.42,
              ease: "power3.out",
              overwrite: true,
            });
          });
        };

        links.forEach((link) => {
          const sectionId = link.dataset.navSection;
          const underline = link.querySelector<HTMLElement>(
            "[data-nav-underline]",
          );
          const label = link.querySelector<HTMLElement>("[data-nav-label]");
          if (!sectionId || !underline || !label) return;

          gsap.set(underline, {
            scaleX: 0,
            autoAlpha: 0,
            transformOrigin: "left center",
          });

          const section = document.getElementById(sectionId);
          if (section) {
            ScrollTrigger.create({
              trigger: section,
              start: "top 45%",
              end: "bottom 45%",
              onToggle: (self) => {
                if (self.isActive) {
                  setActiveSection(sectionId);
                } else if (activeSection === sectionId) {
                  setActiveSection(null);
                }
              },
            });
          }

          const enter = () => {
            gsap.to(label, {
              y: -2,
              duration: 0.32,
              ease: "power3.out",
              overwrite: true,
            });
            gsap.to(underline, {
              scaleX: 1,
              autoAlpha: 1,
              duration: 0.32,
              ease: "power3.out",
              overwrite: true,
            });
          };
          const leave = () => {
            const active = activeSection === sectionId;
            gsap.to(label, {
              y: 0,
              duration: 0.38,
              ease: "power3.out",
              overwrite: true,
            });
            gsap.to(underline, {
              scaleX: active ? 1 : 0,
              autoAlpha: active ? 1 : 0,
              duration: 0.38,
              ease: "power3.out",
              overwrite: true,
            });
          };

          link.addEventListener("mouseenter", enter);
          link.addEventListener("mouseleave", leave);
          link.addEventListener("focus", enter);
          link.addEventListener("blur", leave);
          cleanups.push(() => {
            link.removeEventListener("mouseenter", enter);
            link.removeEventListener("mouseleave", leave);
            link.removeEventListener("focus", enter);
            link.removeEventListener("blur", leave);
          });
        });

        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          const moveX = gsap.quickTo(action, "x", {
            duration: 0.48,
            ease: "power3.out",
          });
          const moveY = gsap.quickTo(action, "y", {
            duration: 0.48,
            ease: "power3.out",
          });
          const pointerMove = (event: PointerEvent) => {
            const bounds = action.getBoundingClientRect();
            moveX((event.clientX - (bounds.left + bounds.width / 2)) * 0.12);
            moveY((event.clientY - (bounds.top + bounds.height / 2)) * 0.16);
          };
          const pointerLeave = () => {
            moveX(0);
            moveY(0);
          };

          action.addEventListener("pointermove", pointerMove);
          action.addEventListener("pointerleave", pointerLeave);
          cleanups.push(() => {
            action.removeEventListener("pointermove", pointerMove);
            action.removeEventListener("pointerleave", pointerLeave);
          });
        }

        ScrollTrigger.refresh();
      }, header);

      return () => {
        readyObserver?.disconnect();
        cleanups.forEach((cleanup) => cleanup());
        context.revert();
      };
    });

    media.add("(prefers-reduced-motion: reduce)", () => {
      header.dataset.navState = "static";
      gsap.set(header, { clearProps: "transform" });
      gsap.set(header.querySelectorAll("[data-nav-underline]"), {
        clearProps: "all",
      });
    });

    return () => media.revert();
  }, []);

  /* Menu mobile: overlay biru dengan line-mask reveal (bahasa yang sama
     dengan headline hero). Selector diambil segar tiap toggle agar link
     kondisional (Dashboard saat login) ikut teranimasi. */
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const links = gsap.utils.toArray<HTMLElement>("[data-menu-link]", overlay);
    const foot = overlay.querySelector<HTMLElement>("[data-menu-foot]");

    document.body.style.overflow = menuOpen ? "hidden" : "";

    if (menuOpen) {
      overlay
        .querySelector<HTMLElement>("[data-menu-close]")
        ?.focus({ preventScroll: true });
      if (reduce) {
        gsap.set(overlay, { autoAlpha: 1 });
        gsap.set(foot ? [...links, foot] : links, { clearProps: "all" });
      } else {
        const tl = gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
          .fromTo(
            links,
            { yPercent: 112 },
            { yPercent: 0, duration: 0.85, stagger: 0.08 },
            0.06,
          );
        if (foot) {
          tl.fromTo(
            foot,
            { y: 16, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.5 },
            0.35,
          );
        }
      }
    } else if (reduce) {
      gsap.set(overlay, { autoAlpha: 0 });
    } else {
      gsap.to(overlay, { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* Tutup menu dengan tombol Escape */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const menuLinks = [
    { href: "/#katalog", label: "Katalog" },
    { href: "/#cara-kerja", label: "Cara Kerja" },
    ...(ready && token
      ? [
          {
            href: role === "admin" ? "/admin" : "/dashboard",
            label: "Dashboard",
          },
        ]
      : [{ href: "/login", label: "Masuk" }]),
  ];

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 will-change-transform"
      >
        <nav
          data-nav-shell
          className="nav-shell border-b border-lavender bg-white/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex h-[68px] max-w-page items-center justify-between px-4 md:px-6">
            <div data-nav-logo>
              <Logo />
            </div>
            <div className="flex items-center gap-2 md:gap-5">
              <Link
                href="/#katalog"
                data-nav-section="katalog"
                className="relative hidden py-2 text-sm font-medium text-gray2 transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric md:block"
              >
                <span data-nav-label className="inline-block">
                  Katalog
                </span>
                <span
                  data-nav-underline
                  aria-hidden
                  className="absolute bottom-0 left-0 h-px w-full bg-blue-deep"
                />
              </Link>
              <Link
                href="/#cara-kerja"
                data-nav-section="cara-kerja"
                className="relative hidden py-2 text-sm font-medium text-gray2 transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric md:block"
              >
                <span data-nav-label className="inline-block">
                  Cara Kerja
                </span>
                <span
                  data-nav-underline
                  aria-hidden
                  className="absolute bottom-0 left-0 h-px w-full bg-blue-deep"
                />
              </Link>
              {ready && token && (
                <Link
                  href={role === "admin" ? "/admin" : "/dashboard"}
                  className="hidden rounded-full bg-blue-tint px-4 py-2 text-sm font-semibold text-blue-deep transition-colors hover:bg-blue-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric active:scale-[0.98] md:block"
                >
                  Dashboard
                </Link>
              )}
              <div data-nav-action>
                {ready && token ? (
                  <div className="hidden items-center gap-3 md:flex">
                    <span className="hidden font-mono text-xs text-gray-muted lg:block">
                      {email}
                    </span>
                    <button
                      onClick={logout}
                      className="rounded-full border border-lavender px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-blue-deep hover:text-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric active:scale-[0.98]"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="arrow-btn block rounded-full bg-blue-deep px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric focus-visible:ring-offset-2 active:scale-[0.98]"
                  >
                    Masuk <span className="arrow">→</span>
                  </Link>
                )}
              </div>
              <button
                data-nav-menu
                type="button"
                aria-expanded={menuOpen}
                aria-controls="menu-mobile"
                aria-label="Buka menu navigasi"
                onClick={() => setMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-lavender text-ink transition-colors hover:border-blue-deep hover:text-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-electric active:scale-[0.96] md:hidden"
              >
                <List size={20} weight="bold" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Menu mobile full-screen: satu momen warna brand, line-mask reveal */}
      <div
        ref={overlayRef}
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className="invisible fixed inset-0 z-[70] flex flex-col bg-blue-deep opacity-0 md:hidden"
      >
        <div className="flex h-[68px] items-center justify-between px-4">
          <Logo light />
          <button
            type="button"
            data-menu-close
            aria-label="Tutup menu navigasi"
            onClick={() => setMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.96]"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center gap-1 px-6">
          {menuLinks.map((l) => (
            <div key={l.href} className="overflow-hidden py-1">
              <Link
                href={l.href}
                data-menu-link
                onClick={() => setMenuOpen(false)}
                className="block font-display text-[13vw] font-semibold uppercase leading-[1.05] tracking-tight text-white transition-colors hover:text-blue-sky focus-visible:text-blue-sky focus-visible:outline-none sm:text-5xl"
              >
                {l.label}
              </Link>
            </div>
          ))}
        </nav>

        {ready && token && (
          <div
            data-menu-foot
            className="flex items-center justify-between gap-4 border-t border-white/15 px-6 py-5"
          >
            <span className="min-w-0 truncate font-mono text-xs text-blue-sky">
              {email}
            </span>
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="shrink-0 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.98]"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </>
  );
}
