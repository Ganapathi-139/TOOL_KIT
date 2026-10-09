"use client";

import { useState } from "react";
import {
  CaseUpper,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function CaseConverterPage() {
  const [text, setText] = useState("the quick brown fox jumps over the lazy dog");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const toSentenceCase = (str: string) => {
    return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  };

  const toCamelCase = (str: string) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
      .replace(/\s+/g, "");
  };

  const toPascalCase = (str: string) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, "");
  };

  const toSnakeCase = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]+/g, "_");
  };

  const toKebabCase = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]+/g, "-");
  };

  const toAlternatingCase = (str: string) => {
    return str
      .split("")
      .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
      .join("");
  };

  const cases = [
    { label: "UPPERCASE", value: text.toUpperCase() },
    { label: "lowercase", value: text.toLowerCase() },
    { label: "Title Case", value: toTitleCase(text) },
    { label: "Sentence case", value: toSentenceCase(text) },
    { label: "camelCase", value: toCamelCase(text) },
    { label: "PascalCase", value: toPascalCase(text) },
    { label: "snake_case", value: toSnakeCase(text) },
    { label: "kebab-case", value: toKebabCase(text) },
    { label: "aLtErNaTiNg", value: toAlternatingCase(text) },
  ];

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Student Tools", href: "/tools/student" },
            { label: "Case Converter" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <CaseUpper size={16} />
            <span>Student & Text Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Text Case Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Instantly transform text between UPPERCASE, lowercase, Title Case, camelCase,
            snake_case, and kebab-case.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex items-center justify-between">
                <label className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Input Text
                </label>
                <button
                  type="button"
                  onClick={() => setText("")}
                  className="font-body text-xs text-red-500 hover:underline"
                >
                  Clear
                </button>
              </div>

              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                className="w-full rounded-lg border p-3 font-body text-sm leading-relaxed"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex justify-between text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                <span>{text.length} characters · {text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
              </div>
            </div>

            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                Converted Formats
              </h3>

              <div className="space-y-3">
                {cases.map((c) => (
                  <div
                    key={c.label}
                    className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold block mb-1" style={{ color: "var(--amber-primary)" }}>
                        {c.label}
                      </span>
                      <p className="font-body text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {c.value || "--"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(c.label, c.value)}
                      className="px-3 py-1.5 rounded-lg border font-body text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {copiedKey === c.label ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                      <span>{copiedKey === c.label ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
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
                <Shield size={16} />
                <h4>Privacy Protected</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Text conversions are applied directly in JavaScript memory. Sensitive notes and code snippets never leave your browser.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
