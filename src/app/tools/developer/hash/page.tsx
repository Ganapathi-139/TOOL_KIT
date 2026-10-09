"use client";

import { useState, useEffect } from "react";
import {
  Hash,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function HashGeneratorPage() {
  const [inputText, setInputText] = useState("Hello ToolKit");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function calculateHashes() {
      if (!inputText) {
        setHashes({});
        return;
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(inputText);

      const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
      const results: Record<string, string> = {};

      for (const algo of algorithms) {
        try {
          const hashBuffer = await crypto.subtle.digest(algo, data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          results[algo] = hashHex;
        } catch (e) {
          console.error(e);
        }
      }

      setHashes(results);
    }

    calculateHashes();
  }, [inputText]);

  const copyToClipboard = (key: string, val: string) => {
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
            { label: "Developer Tools", href: "/tools/developer" },
            { label: "Hash Generator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Hash size={16} />
            <span>Developer Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Cryptographic Hash Generator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Generate secure cryptographic digests (SHA-1, SHA-256, SHA-384, SHA-512) in real time
            using the browser native Web Cryptography API.
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
              <label className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Input Text or Secret
              </label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste text to hash..."
                className="w-full rounded-lg border p-3 font-mono text-sm leading-relaxed"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                Computed Hashes
              </h3>

              <div className="space-y-4">
                {Object.entries(hashes).map(([algo, hashVal]) => (
                  <div key={algo} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs" style={{ color: "var(--amber-primary)" }}>
                        {algo}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(algo, hashVal)}
                        className="px-2.5 py-1 rounded border text-[11px] font-body flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        style={{
                          borderColor: "var(--border-warm)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {copiedKey === algo ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        <span>{copiedKey === algo ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div
                      className="p-2.5 rounded-lg border font-mono text-xs break-all select-all"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {hashVal}
                    </div>
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
                <h4>Hardware-Accelerated WebCrypto</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Hashes are calculated locally by your browser Web Cryptography API. Secrets, strings, and tokens never leave your memory space.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
