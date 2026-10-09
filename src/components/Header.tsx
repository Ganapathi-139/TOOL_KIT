"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Tools", href: "/tools" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-warm)",
        height: "64px",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-headline font-semibold text-xl tracking-tight"
          style={{ color: "var(--amber-primary)" }}
          aria-label="ToolKit home"
        >
          ToolKit
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-base transition-colors duration-150"
                style={{
                  color: isActive
                    ? "var(--amber-primary)"
                    : "var(--text-primary)",
                  fontWeight: isActive ? 500 : 400,
                  borderBottom: isActive
                    ? "2px solid var(--amber-primary)"
                    : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: theme toggle + mobile menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="w-11 h-11 flex items-center justify-center rounded-lg border transition-colors duration-150"
            style={{
              borderColor: "var(--border-warm)",
              color: "var(--text-secondary)",
            }}
          >
            {mounted ? (
              resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />
            ) : (
              <span className="w-5 h-5 block" />
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg border transition-colors duration-150"
            style={{
              borderColor: "var(--border-warm)",
              color: "var(--text-secondary)",
            }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border-warm)",
          }}
        >
          <nav
            className="flex flex-col px-6 py-4 gap-1"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-body text-base py-3 px-3 rounded-lg transition-colors duration-150"
                  style={{
                    color: isActive
                      ? "var(--amber-primary)"
                      : "var(--text-primary)",
                    backgroundColor: isActive ? "var(--amber-tint)" : "",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
