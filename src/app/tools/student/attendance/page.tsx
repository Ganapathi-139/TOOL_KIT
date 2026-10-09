"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  ChevronRight,
  Calculator,
  AlignLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AttendanceCalculatorPage() {
  const [attended, setAttended] = useState<number>(32);
  const [total, setTotal] = useState<number>(45);
  const [target, setTarget] = useState<number>(75);

  const safeAttended = Math.max(0, attended);
  const safeTotal = Math.max(safeAttended, total);
  const currentPercentage = safeTotal > 0 ? (safeAttended / safeTotal) * 100 : 0;
  const isEligible = currentPercentage >= target;

  // Classes to attend consecutively to reach target:
  // (attended + x) / (total + x) >= target / 100
  // 100 * attended + 100 * x >= target * total + target * x
  // x * (100 - target) >= target * total - 100 * attended
  // x = ceil((target * total - 100 * attended) / (100 - target))
  const classesToAttend =
    !isEligible && target < 100
      ? Math.ceil((target * safeTotal - 100 * safeAttended) / (100 - target))
      : 0;

  // Classes you can bunk while staying >= target:
  // attended / (total + y) >= target / 100
  // 100 * attended >= target * total + target * y
  // y = floor((100 * attended - target * total) / target)
  const classesCanBunk =
    isEligible && target > 0
      ? Math.max(0, Math.floor((100 * safeAttended - target * safeTotal) / target))
      : 0;

  const resetDefaults = () => {
    setAttended(30);
    setTotal(40);
    setTarget(75);
  };

  const relatedTools = [
    { name: "CGPA & SGPA Calculator", href: "/tools/student/gpa", icon: Calculator },
    { name: "Word Counter", href: "/tools/student/word-counter", icon: AlignLeft },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Student Tools", href: "/tools/student" },
            { label: "Attendance Calculator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <CalendarCheck size={16} />
            <span>Student Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Attendance Calculator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Calculate your current percentage, how many classes you must attend to avoid a shortage, or how many you can safely miss.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Input Card */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="classes-attended" className="block font-body text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Classes Attended
                  </label>
                  <input
                    id="classes-attended"
                    type="number"
                    min="0"
                    value={attended}
                    onChange={(e) => setAttended(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-lg border font-headline font-bold text-xl focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="classes-total" className="block font-body text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Total Classes Held
                  </label>
                  <input
                    id="classes-total"
                    type="number"
                    min="1"
                    value={total}
                    onChange={(e) => setTotal(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-lg border font-headline font-bold text-xl focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="target-attendance" className="block font-body text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Target Percentage (%)
                  </label>
                  <input
                    id="target-attendance"
                    type="number"
                    min="1"
                    max="100"
                    value={target}
                    onChange={(e) => setTarget(Math.min(100, Math.max(1, parseInt(e.target.value) || 75)))}
                    className="w-full px-3.5 py-2.5 rounded-lg border font-headline font-bold text-xl focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Target quick preset chips */}
              <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "var(--border-warm)" }}>
                <span className="text-xs font-body" style={{ color: "var(--text-muted)" }}>Target Presets:</span>
                {[75, 80, 85, 90].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTarget(preset)}
                    className="px-2.5 py-1 rounded text-xs font-body font-medium transition-colors"
                    style={{
                      backgroundColor: target === preset ? "var(--amber-tint)" : "var(--surface-tinted)",
                      color: target === preset ? "var(--amber-primary)" : "var(--text-secondary)",
                      border: target === preset ? "1px solid var(--amber-primary)" : "1px solid var(--border-warm)",
                    }}
                  >
                    {preset}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetDefaults}
                  className="ml-auto text-xs font-body flex items-center gap-1 hover:underline"
                  style={{ color: "var(--text-muted)" }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Results Presentation Banner */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: isEligible ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Current Attendance
                  </p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span
                      className="font-headline font-bold text-5xl"
                      style={{ color: isEligible ? "#10b981" : "var(--amber-primary)" }}
                    >
                      {currentPercentage.toFixed(1)}%
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: isEligible ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isEligible ? "#10b981" : "#ef4444",
                      }}
                    >
                      {isEligible ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>On Track</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} />
                          <span>Shortage</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                  <p>Target Threshold: <span className="font-semibold">{target}%</span></p>
                  <p className="mt-0.5">Classes Attended: <span className="font-semibold">{safeAttended} / {safeTotal}</span></p>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div>
                <div
                  className="w-full h-3 rounded-full overflow-hidden relative"
                  style={{ backgroundColor: "var(--surface-tinted)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, currentPercentage)}%`,
                      backgroundColor: isEligible ? "#10b981" : "var(--amber-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Actionable Verdict Box */}
              <div
                className="p-5 rounded-xl border flex items-start gap-3.5"
                style={{
                  backgroundColor: isEligible ? "rgba(16, 185, 129, 0.05)" : "rgba(200, 123, 58, 0.08)",
                  borderColor: isEligible ? "rgba(16, 185, 129, 0.2)" : "rgba(200, 123, 58, 0.25)",
                }}
              >
                {isEligible ? (
                  <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="font-body text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {isEligible ? (
                    <>
                      <p className="font-semibold text-base mb-1" style={{ color: "#10b981" }}>
                        Attendance is Safe!
                      </p>
                      <p>
                        You can safely miss the next{" "}
                        <strong className="font-bold underline decoration-emerald-500 underline-offset-2">
                          {classesCanBunk} {classesCanBunk === 1 ? "class" : "classes"}
                        </strong>{" "}
                        and still maintain your required {target}% attendance.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-base mb-1" style={{ color: "var(--amber-primary)" }}>
                        Attendance Shortage Alert
                      </p>
                      <p>
                        You must attend the next{" "}
                        <strong className="font-bold underline decoration-amber-600 underline-offset-2">
                          {classesToAttend} consecutive {classesToAttend === 1 ? "class" : "classes"}
                        </strong>{" "}
                        without missing any to raise your attendance back above {target}%.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                Attendance Guide
              </h3>
              <div className="space-y-3 font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>75% Rule</p>
                  <p>Most universities and colleges require a minimum of 75% attendance to be eligible to sit for semester examinations.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Medical Exemptions</p>
                  <p>Typically 65% with valid medical documentation, though policies differ by university board.</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-base" style={{ color: "var(--amber-primary)" }}>
                <Shield size={18} />
                <h4>No Logs Stored</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your attendance entries and college schedules are computed live on your device and are never tracked or saved.
              </p>
            </div>

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
              <div className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                {relatedTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="py-3 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ToolIcon size={16} style={{ color: "var(--amber-primary)" }} />
                        <span
                          className="font-body text-sm group-hover:text-[var(--amber-primary)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tool.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
