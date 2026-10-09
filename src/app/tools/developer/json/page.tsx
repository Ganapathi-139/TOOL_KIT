"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Braces,
  Copy,
  Check,
  Download,
  RotateCcw,
  Shield,
  ChevronRight,
  AlertCircle,
  Binary,
  Terminal,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

const sampleJson = JSON.stringify(
  {
    project: "ToolKit",
    version: "1.0.0",
    features: ["client-side", "privacy-first", "high-performance"],
    metrics: {
      uptime: 99.99,
      localProcessing: true,
      activeUsers: 15420,
    },
    tools: [
      { name: "Merge PDF", category: "pdf", status: "active" },
      { name: "QR Generator", category: "qr", status: "active" },
      { name: "JSON Formatter", category: "developer", status: "active" },
    ],
  },
  null,
  2
);

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState<string>(sampleJson);
  const [indentSize, setIndentSize] = useState<number | "tab">(2);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    message?: string;
    line?: number;
    column?: number;
  }>({ isValid: true });
  const [copied, setCopied] = useState<boolean>(false);

  const formatJson = (indent: number | "tab" = indentSize) => {
    try {
      if (!inputJson.trim()) {
        setValidationState({ isValid: true });
        return;
      }
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, indent === "tab" ? "\t" : indent);
      setInputJson(formatted);
      setValidationState({ isValid: true, message: "Valid JSON formatted successfully!" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Try parsing line and column numbers from message
        const match = err.message.match(/at position (\d+)/);
        let lineInfo = "";
        if (match) {
          const pos = parseInt(match[1], 10);
          const lines = inputJson.slice(0, pos).split("\n");
          const line = lines.length;
          const col = lines[lines.length - 1].length + 1;
          lineInfo = ` (Line ${line}, Column ${col})`;
        }
        setValidationState({
          isValid: false,
          message: `${err.message}${lineInfo}`,
        });
      }
    }
  };

  const minifyJson = () => {
    try {
      if (!inputJson.trim()) return;
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setInputJson(minified);
      setValidationState({ isValid: true, message: "Valid JSON minified successfully!" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setValidationState({ isValid: false, message: err.message });
      }
    }
  };

  const validateJson = () => {
    try {
      if (!inputJson.trim()) {
        setValidationState({ isValid: false, message: "Please enter JSON to validate." });
        return;
      }
      JSON.parse(inputJson);
      setValidationState({ isValid: true, message: "JSON is completely valid!" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setValidationState({ isValid: false, message: err.message });
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJsonFile = () => {
    const blob = new Blob([inputJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const linesCount = inputJson ? inputJson.split("\n").length : 0;
  const charactersCount = inputJson.length;
  const byteSize = new Blob([inputJson]).size;

  const relatedTools = [
    { name: "Base64 Encoder / Decoder", href: "/tools/developer/base64", icon: Binary },
    { name: "Regex Tester", href: "/tools/developer/regex", icon: Terminal },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Developer Tools", href: "/tools/developer" },
            { label: "JSON Formatter" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Braces size={16} />
            <span>Developer Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            JSON Formatter & Validator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Prettify, minify, and inspect JSON payloads with line-by-line syntax validation directly in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Toolbar */}
            <div
              className="p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => formatJson()}
                  className="px-4 py-2 rounded-lg font-body font-semibold text-xs text-white transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Beautify
                </button>

                <button
                  onClick={minifyJson}
                  className="px-3 py-2 rounded-lg border font-body text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  Minify
                </button>

                <button
                  onClick={validateJson}
                  className="px-3 py-2 rounded-lg border font-body text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                >
                  Validate
                </button>

                <select
                  value={String(indentSize)}
                  onChange={(e) => {
                    const val = e.target.value === "tab" ? "tab" : Number(e.target.value);
                    setIndentSize(val as number | "tab");
                    formatJson(val as number | "tab");
                  }}
                  className="px-2.5 py-1.5 rounded-lg border font-body text-xs focus:outline-none"
                  style={{
                    backgroundColor: "var(--bg-warm)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <option value="2">2 Spaces</option>
                  <option value="4">4 Spaces</option>
                  <option value="tab">Tab Indent</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  onClick={downloadJsonFile}
                  className="px-3 py-1.5 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setInputJson("")}
                  className="p-1.5 rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Clear input"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Validation Banner */}
            {validationState.message && (
              <div
                className="p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-body"
                style={{
                  backgroundColor: validationState.isValid ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  borderColor: validationState.isValid ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  color: validationState.isValid ? "#10b981" : "#ef4444",
                }}
              >
                {validationState.isValid ? <Check size={16} /> : <AlertCircle size={16} />}
                <span className="font-medium">{validationState.message}</span>
              </div>
            )}

            {/* Editor Textarea */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div
                className="px-4 py-2 border-b flex items-center justify-between text-xs font-mono"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-muted)",
                }}
              >
                <span>JSON Editor</span>
                <span>
                  {linesCount} lines · {charactersCount} chars · {byteSize} bytes
                </span>
              </div>

              <textarea
                value={inputJson}
                onChange={(e) => {
                  setInputJson(e.target.value);
                  setValidationState({ isValid: true });
                }}
                rows={18}
                placeholder="Paste your raw JSON object or array here..."
                className="w-full p-4 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-y"
                style={{
                  backgroundColor: "var(--bg-warm)",
                  color: "var(--text-primary)",
                }}
                spellCheck={false}
              />
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
                Common JSON Errors
              </h3>
              <div className="space-y-3 font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Trailing Commas</p>
                  <p>Standard JSON prohibits trailing commas after the last key-value pair or array element.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Double Quotes Required</p>
                  <p>All property keys and string values must be enclosed in double quotes (&quot;), never single quotes (&apos;).</p>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Supported Primitives</p>
                  <p>Strings, numbers, objects, arrays, booleans (true/false), and null are allowed. undefined and functions are invalid.</p>
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
                <h4>Strict Confidentiality</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Zero payload leakage. Your API responses, secrets, and JSON payloads are formatted purely within local V8 JavaScript memory.
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
                Related Developer Tools
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
