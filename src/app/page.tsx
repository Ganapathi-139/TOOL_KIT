import type { Metadata } from "next";
import Link from "next/link";
import { Search, CheckCircle, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CategoryCard } from "@/components/CategoryCard";
import { ToolCard } from "@/components/ToolCard";
import { Icon } from "@/components/Icon";
import { categories, getPopularTools, tools } from "@/lib/tools-data";

export const metadata: Metadata = {
  title: "Project Name — Free Online Tools",
  description:
    "PDF converters, QR code generators, image editors, student tools, developer utilities — free, no sign-up needed.",
};

const popularTools = getPopularTools().slice(0, 6);
const popularChips = [
  { id: "merge-pdf", name: "Merge PDF", icon: "FilePlus2", href: "/tools/pdf/merge" },
  { id: "image-to-pdf", name: "Image to PDF", icon: "ImageDown", href: "/tools/pdf/image-to-pdf" },
  { id: "qr-generator", name: "QR Code Generator", icon: "QrCode", href: "/tools/qr/generator" },
  { id: "word-counter", name: "Word Counter", icon: "AlignLeft", href: "/tools/student/word-counter" },
  { id: "base64", name: "Base64 Encoder", icon: "Binary", href: "/tools/developer/base64" },
];

const trustItems = [
  { icon: "CheckCircle", label: "Works in your browser" },
  { icon: "CheckCircle", label: "No account needed" },
  { icon: "CheckCircle", label: "Simple to use" },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="max-w-[800px] mx-auto px-6 pt-20 pb-20 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium uppercase tracking-wider mb-6 font-body border"
            style={{
              color: "var(--amber-primary)",
              borderColor: "var(--amber-primary)",
              backgroundColor: "var(--amber-tint)",
            }}
          >
            <Zap size={13} aria-hidden="true" />
            All the tools you need, in one place
          </div>

          {/* H1 */}
          <h1
            className="font-headline font-bold text-4xl sm:text-5xl leading-[1.15] tracking-[-0.02em]"
            style={{ color: "var(--text-primary)" }}
          >
            Useful online tools,{" "}
            <span
              className="whitespace-nowrap"
              style={{ color: "var(--amber-primary)" }}
            >
              —
            </span>{" "}
            free for everyone.
          </h1>

          {/* Sub */}
          <p
            className="font-body text-lg leading-relaxed max-w-2xl mx-auto mt-5"
            style={{ color: "var(--text-secondary)" }}
          >
            PDF converters, QR codes, image editors, calculators, and more
            &mdash; no sign-up needed.
          </p>

          {/* Search bar */}
          <div className="max-w-[600px] mx-auto mt-8">
            <form
              action="/tools"
              method="GET"
              role="search"
              className="relative flex items-center h-[52px] rounded-lg border p-1.5 transition-all"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="pl-3 pr-2 flex items-center pointer-events-none shrink-0">
                <Search
                  size={20}
                  style={{ color: "var(--text-secondary)" }}
                  aria-hidden="true"
                />
              </div>
              <input
                type="search"
                name="q"
                placeholder="Search for a tool…"
                aria-label="Search tools"
                className="w-full border-0 bg-transparent focus:ring-0 focus:outline-none font-body text-base px-2"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                type="submit"
                className="shrink-0 h-[38px] px-5 rounded-[6px] font-body font-medium text-sm text-white transition-colors duration-150"
                style={{ backgroundColor: "var(--amber-primary)" }}
                aria-label="Search"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* ── CATEGORIES ─────────────────────────────────────────────────── */}
        <section
          className="max-w-[1200px] mx-auto px-6 pb-20"
          aria-labelledby="categories-heading"
        >
          <p
            id="categories-heading"
            className="font-body font-medium text-xs uppercase tracking-[0.08em] mb-6"
            style={{ color: "var(--amber-primary)" }}
          >
            Browse by category
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>

        {/* ── POPULAR TOOLS ──────────────────────────────────────────────── */}
        <section
          className="w-full border-y py-20"
          style={{
            backgroundColor: "var(--surface-tinted)",
            borderColor: "var(--border-warm)",
          }}
          aria-labelledby="popular-heading"
        >
          <div className="max-w-[1200px] mx-auto px-6">
            <p
              id="popular-heading"
              className="font-body font-medium text-xs uppercase tracking-[0.08em] mb-4"
              style={{ color: "var(--amber-primary)" }}
            >
              Popular tools
            </p>

            {/* Quick-access chips */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {popularChips.map((chip) => (
                <Link
                  key={chip.id}
                  href={chip.href}
                  className="shrink-0 rounded-lg border px-5 py-3 flex items-center gap-2.5 font-body font-medium text-sm transition-colors duration-150"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Icon
                    name={chip.icon}
                    size={16}
                    style={{ color: "var(--amber-primary)" }}
                    aria-hidden="true"
                  />
                  {chip.name}
                </Link>
              ))}
            </div>

            {/* Featured tool cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {popularTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST ──────────────────────────────────────────────────────── */}
        <section
          className="py-16 max-w-[700px] mx-auto px-6 text-center"
          aria-label="Why use Project Name"
        >
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-10">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <CheckCircle
                  size={20}
                  style={{ color: "var(--amber-primary)" }}
                  aria-hidden="true"
                />
                <span
                  className="font-body text-[15px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
