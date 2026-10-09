"use client";

import { useState, useMemo } from "react";
import {
  Terminal,
  Copy,
  Check,
  Shield,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  sample: string;
}

const presets: RegexPreset[] = [
  {
    name: "Email Address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    sample: "Contact us at support@example.com or sales.dept@company.co.uk.",
  },
  {
    name: "URL / Web Link",
    pattern: "https?:\\/\\/[\\w\\.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!$&'()*+,;=.]+",
    flags: "g",
    sample: "Visit https://toolkit.dev or http://example.org/docs?page=1#intro.",
  },
  {
    name: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: "g",
    sample: "Local router: 192.168.1.1, DNS: 8.8.8.8, invalid: 300.1.2.3.",
  },
  {
    name: "Hex Color",
    pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b",
    flags: "g",
    sample: "Brand colors are #D97706, #FFF, and #333333.",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
    sample: "Created on 2026-10-09, due on 2026-12-31.",
  },
];

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState<string>("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
  const [flagG, setFlagG] = useState(true);
  const [flagI, setFlagI] = useState(true);
  const [flagM, setFlagM] = useState(false);
  const [flagS, setFlagS] = useState(false);
  const [testText, setTestText] = useState<string>(
    "Hello team, please send reports to contact@toolkit.dev or manager123@sub.company.org by tomorrow."
  );
  const [copied, setCopied] = useState(false);

  const flags = `${flagG ? "g" : ""}${flagI ? "i" : ""}${flagM ? "m" : ""}${flagS ? "s" : ""}`;

  const { regex, error } = useMemo(() => {
    try {
      if (!pattern) return { regex: null, error: null };
      const reg = new RegExp(pattern, flags);
      return { regex: reg, error: null };
    } catch (e: unknown) {
      return { regex: null, error: e instanceof Error ? e.message : "Invalid Regular Expression" };
    }
  }, [pattern, flags]);

  const matches = useMemo(() => {
    if (!regex || !testText || error) return [];

    const results: Array<{ text: string; index: number; groups: string[] }> = [];

    if (flags.includes("g")) {
      const regClone = new RegExp(regex.source, regex.flags);
      let match: RegExpExecArray | null;
      let iterations = 0;
      while ((match = regClone.exec(testText)) !== null && iterations < 1000) {
        iterations++;
        results.push({
          text: match[0],
          index: match.index,
          groups: match.slice(1),
        });
        if (match.index === regClone.lastIndex) {
          regClone.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(testText);
      if (match) {
        results.push({
          text: match[0],
          index: match.index,
          groups: match.slice(1),
        });
      }
    }

    return results;
  }, [regex, testText, error, flags]);

  const handleCopyMatches = () => {
    if (matches.length === 0) return;
    navigator.clipboard.writeText(matches.map((m) => m.text).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset: RegexPreset) => {
    setPattern(preset.pattern);
    setTestText(preset.sample);
    setFlagG(preset.flags.includes("g"));
    setFlagI(preset.flags.includes("i"));
    setFlagM(preset.flags.includes("m"));
    setFlagS(preset.flags.includes("s"));
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Developer Tools", href: "/tools/developer" },
            { label: "Regex Tester" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Terminal size={16} />
            <span>Developer Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Regular Expression (Regex) Tester
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Test, validate, and inspect regular expressions with real-time match highlighting,
            flag toggling, and capture group extraction.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Pattern Input & Flags */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div>
                <label className="block font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Regular Expression Pattern
                </label>
                <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-warm)", backgroundColor: "var(--surface-tinted)" }}>
                  <span className="px-3 font-mono text-sm select-none" style={{ color: "var(--text-muted)" }}>/</span>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Enter regex pattern..."
                    className="w-full bg-transparent py-2.5 font-mono text-sm focus:outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <span className="px-3 font-mono text-sm select-none" style={{ color: "var(--text-muted)" }}>/{flags}</span>
                </div>
              </div>

              {/* Flags Toggle */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="font-body text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Flags:
                </span>
                {[
                  { label: "Global (g)", checked: flagG, toggle: () => setFlagG(!flagG) },
                  { label: "Case-insensitive (i)", checked: flagI, toggle: () => setFlagI(!flagI) },
                  { label: "Multiline (m)", checked: flagM, toggle: () => setFlagM(!flagM) },
                  { label: "DotAll (s)", checked: flagS, toggle: () => setFlagS(!flagS) },
                ].map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={f.toggle}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-medium border transition-all ${
                      f.checked ? "ring-1 ring-amber-500 font-semibold" : "opacity-60"
                    }`}
                    style={{
                      backgroundColor: f.checked ? "var(--amber-tint)" : "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 rounded-lg border text-xs text-red-500 flex items-center gap-2" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Test String */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center justify-between">
                <label className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Test String
                </label>
                <span className="font-mono text-xs" style={{ color: "var(--amber-primary)" }}>
                  {matches.length} {matches.length === 1 ? "match" : "matches"} found
                </span>
              </div>

              <textarea
                rows={6}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type or paste sample text here to test your regular expression..."
                className="w-full rounded-lg border p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Match Results */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-warm)" }}>
                <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                  Matches List ({matches.length})
                </h3>
                {matches.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyMatches}
                    className="px-3 py-1.5 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy All Matches"}</span>
                  </button>
                )}
              </div>

              {matches.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {matches.map((m, idx) => (
                    <div
                      key={`${m.index}-${idx}`}
                      className="p-3 rounded-lg border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {m.text}
                        </span>
                      </div>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Index {m.index}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-body text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                  {pattern ? "No matches found in the test string." : "Enter a pattern to test."}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar & Presets */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center gap-2 mb-4 font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                <Sparkles size={18} style={{ color: "var(--amber-primary)" }} />
                <h3>Common Regex Presets</h3>
              </div>
              <div className="flex flex-col gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-lg border text-left font-body text-xs transition-all hover:border-amber-500"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <div className="font-semibold text-sm mb-0.5">{preset.name}</div>
                    <code className="text-[10px] text-amber-600 dark:text-amber-400 truncate block">
                      /{preset.pattern}/{preset.flags}
                    </code>
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-sm" style={{ color: "var(--amber-primary)" }}>
                <Shield size={16} />
                <h4>Client-Side Execution</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                All regular expressions are parsed and matched natively using the JavaScript RegExp engine inside your browser. No strings are transmitted to any server.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
