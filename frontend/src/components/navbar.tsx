"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./logo";

/**
 * Navbar putih satu baris (tinggi 68px) + announcement bar biru di atasnya.
 */
export function Navbar() {
  const { token, role, email, ready, logout } = useAuth();
  const headerRef = useRef<HTMLElement>(null);

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

          moveHeader(nextState === "hidden" ? -(navHeight + 8) : 0);
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

  return (
    <header ref={headerRef} className="sticky top-0 z-50 will-change-transform">
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
              className="relative hidden py-2 text-sm font-medium text-gray2 transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none md:block"
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
              className="relative hidden py-2 text-sm font-medium text-gray2 transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none md:block"
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
                className="rounded-full bg-blue-tint px-4 py-2 text-sm font-semibold text-blue-deep transition-colors hover:bg-blue-deep hover:text-white active:scale-[0.98]"
              >
                Dashboard
              </Link>
            )}
            <div data-nav-action>
              {ready && token ? (
                <div className="flex items-center gap-3">
                  <span className="hidden font-mono text-xs text-gray-muted lg:block">
                    {email}
                  </span>
                  <button
                    onClick={logout}
                    className="rounded-full border border-lavender px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-blue-deep hover:text-blue-deep active:scale-[0.98]"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="arrow-btn block rounded-full bg-blue-deep px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-electric active:scale-[0.98]"
                >
                  Masuk <span className="arrow">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
