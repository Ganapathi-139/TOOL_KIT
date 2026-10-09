"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Percent,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PercentageCalculatorPage() {
  // Mode 1: What is X% of Y?
  const [p1X, setP1X] = useState<string>("15");
  const [p1Y, setP1Y] = useState<string>("250");

  // Mode 2: X is what percent of Y?
  const [p2X, setP2X] = useState<string>("45");
  const [p2Y, setP2Y] = useState<string>("150");

  // Mode 3: Percentage change from X to Y
  const [p3X, setP3X] = useState<string>("80");
  const [p3Y, setP3Y] = useState<string>("120");

  const calc1 = () => {
    const x = parseFloat(p1X);
    const y = parseFloat(p1Y);
    if (isNaN(x) || isNaN(y)) return "--";
    return ((x / 100) * y).toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const calc2 = () => {
    const x = parseFloat(p2X);
    const y = parseFloat(p2Y);
    if (isNaN(x) || isNaN(y) || y === 0) return "--";
    return (((x / y) * 100)).toFixed(2) + "%";
  };

  const calc3 = () => {
    const x = parseFloat(p3X);
    const y = parseFloat(p3Y);
    if (isNaN(x) || isNaN(y) || x === 0) return "--";
    const diff = y - x;
    const pct = (diff / Math.abs(x)) * 100;
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct.toFixed(2)}% (${diff >= 0 ? "increase" : "decrease"})`;
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Student Tools", href: "/tools/student" },
            { label: "Percentage Calculator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Percent size={16} />
            <span>Student & Math Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Percentage Calculator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Quickly calculate percentages, ratios, mark fractions, and percentage increases or decreases.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Mode 1 */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                1. What is X% of Y?
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>What is</span>
                <input
                  type="number"
                  value={p1X}
                  onChange={(e) => setP1X(e.target.value)}
                  className="w-28 rounded-lg border px-3 py-2 font-mono text-sm text-center"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>% of</span>
                <input
                  type="number"
                  value={p1Y}
                  onChange={(e) => setP1Y(e.target.value)}
                  className="w-32 rounded-lg border px-3 py-2 font-mono text-sm text-center"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>?</span>
                <ArrowRight size={18} className="hidden sm:block" style={{ color: "var(--text-muted)" }} />
                <div
                  className="flex-1 w-full sm:w-auto p-2.5 rounded-lg border text-center font-headline font-bold text-lg"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    borderColor: "var(--border-warm)",
                    color: "var(--amber-primary)",
                  }}
                >
                  {calc1()}
                </div>
              </div>
            </div>

            {/* Mode 2 */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                2. X is what percent of Y?
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  value={p2X}
                  onChange={(e) => setP2X(e.target.value)}
                  className="w-28 rounded-lg border px-3 py-2 font-mono text-sm text-center"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>is what % of</span>
                <input
                  type="number"
                  value={p2Y}
                  onChange={(e) => setP2Y(e.target.value)}
                  className="w-32 rounded-lg border px-3 py-2 font-mono text-sm text-center"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>?</span>
                <ArrowRight size={18} className="hidden sm:block" style={{ color: "var(--text-muted)" }} />
                <div
                  className="flex-1 w-full sm:w-auto p-2.5 rounded-lg border text-center font-headline font-bold text-lg"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    borderColor: "var(--border-warm)",
                    color: "var(--amber-primary)",
                  }}
                >
                  {calc2()}
                </div>
              </div>
            </div>

            {/* Mode 3 */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                3. Percentage Change (Increase or Decrease)
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>From</span>
                <input
                  type="number"
                  value={p3X}
                  onChange={(e) => setP3X(e.target.value)}
                  className="w-28 rounded-lg border px-3 py-2 font-mono text-sm text-center"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>to</span>
                <input
                  type="number"
                  value={p3Y}
                  onChange={(e) => setP3Y(e.target.value)}
                  className="w-32 rounded-lg border px-3 py-2 font-mono text-sm text-center"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
                <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>=</span>
                <ArrowRight size={18} className="hidden sm:block" style={{ color: "var(--text-muted)" }} />
                <div
                  className="flex-1 w-full sm:w-auto p-2.5 rounded-lg border text-center font-headline font-bold text-base"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    borderColor: "var(--border-warm)",
                    color: "var(--amber-primary)",
                  }}
                >
                  {calc3()}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
                Related Student Tools
              </h3>
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "CGPA & SGPA Calculator", href: "/tools/student/gpa" },
                  { name: "Attendance Calculator", href: "/tools/student/attendance" },
                  { name: "Word Counter", href: "/tools/student/word-counter" },
                ].map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span>{t.name}</span>
                    <ChevronRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
