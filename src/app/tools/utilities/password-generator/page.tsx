"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let chars = "";
    if (useUpper) chars += excludeAmbiguous ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLower) chars += excludeAmbiguous ? "abcdefghijkmnpqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) chars += excludeAmbiguous ? "23456789" : "0123456789";
    if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!chars) {
      setPassword("");
      return;
    }

    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }

    setPassword(result);
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate password strength
  const calculateStrength = () => {
    let pool = 0;
    if (useUpper) pool += 26;
    if (useLower) pool += 26;
    if (useNumbers) pool += 10;
    if (useSymbols) pool += 28;
    if (pool === 0 || length === 0) return { score: 0, text: "None", color: "#9ca3af" };

    const entropy = length * Math.log2(pool);
    if (entropy < 40) return { score: 1, text: "Weak", color: "#ef4444" };
    if (entropy < 60) return { score: 2, text: "Moderate", color: "#f59e0b" };
    if (entropy < 80) return { score: 3, text: "Strong", color: "#10b981" };
    return { score: 4, text: "Very Strong", color: "#059669" };
  };

  const strength = calculateStrength();

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Everyday Utilities", href: "/tools/utilities" },
            { label: "Password Generator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <KeyRound size={16} />
            <span>Everyday Utilities</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Secure Password Generator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Generate strong, cryptographically unguessable passwords using hardware-entropy browser randomness.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Generated Output Card */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--border-warm)" }}>
                <span className="font-mono text-lg sm:text-xl font-bold tracking-wider select-all break-all" style={{ color: "var(--text-primary)" }}>
                  {password || "Select at least one character set"}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                    aria-label="Regenerate password"
                  >
                    <RefreshCcw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-lg font-body text-xs font-semibold flex items-center gap-1.5 text-white transition-all"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Strength Bar */}
              <div className="flex items-center gap-3">
                <span className="font-body text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Security:
                </span>
                <div className="flex-1 flex gap-1 h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className="flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor: step <= strength.score ? strength.color : "transparent",
                      }}
                    />
                  ))}
                </div>
                <span className="font-body text-xs font-bold" style={{ color: strength.color }}>
                  {strength.text}
                </span>
              </div>
            </div>

            {/* Customization Options */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                Password Options
              </h3>

              {/* Length Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-body text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Password Length
                  </label>
                  <span className="font-mono text-base font-bold" style={{ color: "var(--amber-primary)" }}>
                    {length}
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-[11px] mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                  <span>6</span>
                  <span>16</span>
                  <span>32</span>
                  <span>64</span>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { label: "Uppercase Letters (A-Z)", checked: useUpper, set: setUseUpper },
                  { label: "Lowercase Letters (a-z)", checked: useLower, set: setUseLower },
                  { label: "Numbers (0-9)", checked: useNumbers, set: setUseNumbers },
                  { label: "Special Symbols (!@#$)", checked: useSymbols, set: setUseSymbols },
                  { label: "Avoid Ambiguous (1, l, 0, O)", checked: excludeAmbiguous, set: setExcludeAmbiguous },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer hover:border-amber-500 transition-all"
                    style={{
                      backgroundColor: item.checked ? "var(--amber-tint)" : "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.set(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-body text-xs font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-sm" style={{ color: "var(--amber-primary)" }}>
                <ShieldCheck size={18} />
                <h4>True Randomness</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Unlike basic generators that use predictable <code>Math.random()</code>, this tool uses <code>crypto.getRandomValues()</code>, drawing entropy directly from your operating system cryptographic kernel.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
