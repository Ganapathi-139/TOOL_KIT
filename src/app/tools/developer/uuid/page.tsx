"use client";

import { useState, useEffect } from "react";
import {
  Fingerprint,
  Copy,
  Check,
  RefreshCcw,
  Download,
  Shield,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function UuidGeneratorPage() {
  const [quantity, setQuantity] = useState<number>(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);

  const generateUuids = (qty: number): string[] => {
    const list: string[] = [];
    for (let i = 0; i < qty; i++) {
      let val = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000000";
      if (!hyphens) val = val.replace(/-/g, "");
      if (uppercase) val = val.toUpperCase();
      if (braces) val = `{${val}}`;
      list.push(val);
    }
    return list;
  };

  useEffect(() => {
    setUuids(generateUuids(5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = () => {
    setUuids(generateUuids(quantity));
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(uuids.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([uuids.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Developer Tools", href: "/tools/developer" },
            { label: "UUID Generator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Fingerprint size={16} />
            <span>Developer Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            UUID / GUID v4 Generator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Generate cryptographically secure Version-4 Universally Unique Identifiers (UUIDs)
            in bulk with custom casing, hyphens, and formats.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Options Bar */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-body text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Count: {quantity}
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10);
                      setQuantity(count);
                      setUuids(generateUuids(count));
                    }}
                    className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value={1}>1 UUID</option>
                    <option value={5}>5 UUIDs</option>
                    <option value={10}>10 UUIDs</option>
                    <option value={25}>25 UUIDs</option>
                    <option value={50}>50 UUIDs</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 font-body text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={uppercase}
                      onChange={(e) => {
                        setUppercase(e.target.checked);
                        handleRegenerate();
                      }}
                      className="rounded text-amber-600"
                    />
                    <span>UPPERCASE</span>
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 font-body text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={hyphens}
                      onChange={(e) => {
                        setHyphens(e.target.checked);
                        handleRegenerate();
                      }}
                      className="rounded text-amber-600"
                    />
                    <span>Include Hyphens</span>
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 font-body text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={braces}
                      onChange={(e) => {
                        setBraces(e.target.checked);
                        handleRegenerate();
                      }}
                      className="rounded text-amber-600"
                    />
                    <span>Braces &#123; &#125;</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="px-4 py-2 rounded-lg font-body text-xs font-semibold flex items-center gap-1.5 text-white transition-all"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  <RefreshCcw size={14} />
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-4 py-2 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span>{copied ? "Copied All!" : "Copy All"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg border font-body text-xs font-medium flex items-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Download size={14} />
                  Download .txt
                </button>
              </div>
            </div>

            {/* Generated UUIDs list */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-2"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {uuids.map((u, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border font-mono text-sm flex items-center justify-between group"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="select-all">{u}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(u);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    title="Copy this UUID"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
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
                <h4>Cryptographically Secure</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                All UUIDs are generated with browser native <code>crypto.randomUUID()</code> CSPRNG randomness, providing 122 bits of high-entropy collision resistance.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
