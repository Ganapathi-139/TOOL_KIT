"use client";

import { useState, useMemo } from "react";
import {
  Link as LinkIcon,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function UrlEncoderPage() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [encodeType, setEncodeType] = useState<"component" | "full">("component");
  const [inputText, setInputText] = useState("https://example.com/search?q=hello world & category=tech");
  const [copied, setCopied] = useState(false);

  const outputText = useMemo(() => {
    if (!inputText) return "";
    try {
      if (mode === "encode") {
        return encodeType === "component"
          ? encodeURIComponent(inputText)
          : encodeURI(inputText);
      } else {
        return decodeURIComponent(inputText);
      }
    } catch (e: unknown) {
      return `Error: ${e instanceof Error ? e.message : "Malformed URI sequence"}`;
    }
  }, [inputText, mode, encodeType]);

  const queryParams = useMemo(() => {
    try {
      const urlToParse = inputText.includes("://") ? inputText : `https://temp.org/${inputText}`;
      const url = new URL(urlToParse);
      const params: Array<{ key: string; value: string }> = [];
      url.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      return params;
    } catch {
      return [];
    }
  }, [inputText]);

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Developer Tools", href: "/tools/developer" },
            { label: "URL Encoder / Decoder" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <LinkIcon size={16} />
            <span>Developer Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            URL Encoder & Decoder
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Safely percent-encode special characters in URLs or decode encoded URI strings back to plain text.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {/* Mode Selection */}
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-warm)" }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("encode")}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      mode === "encode" ? "ring-2 ring-amber-500 font-bold" : ""
                    }`}
                    style={{
                      backgroundColor: mode === "encode" ? "var(--amber-tint)" : "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Encode URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("decode")}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      mode === "decode" ? "ring-2 ring-amber-500 font-bold" : ""
                    }`}
                    style={{
                      backgroundColor: mode === "decode" ? "var(--amber-tint)" : "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Decode URL
                  </button>
                </div>

                {mode === "encode" && (
                  <div className="flex items-center gap-2 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="encodeType"
                        checked={encodeType === "component"}
                        onChange={() => setEncodeType("component")}
                        className="text-amber-600"
                      />
                      <span>encodeURIComponent</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="encodeType"
                        checked={encodeType === "full"}
                        onChange={() => setEncodeType("full")}
                        className="text-amber-600"
                      />
                      <span>encodeURI</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Input Textarea */}
              <div>
                <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  {mode === "encode" ? "Input String or URL to Encode" : "Encoded URL to Decode"}
                </label>
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter URL or text..."
                  className="w-full rounded-lg border p-3 font-mono text-xs leading-relaxed"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Output Result */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-body text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Output Result
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1 rounded border text-xs font-medium flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={outputText}
                  className="w-full rounded-lg border p-3 font-mono text-xs leading-relaxed select-all"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Query Parameter Parser */}
              {queryParams.length > 0 && (
                <div className="border-t pt-4" style={{ borderColor: "var(--border-warm)" }}>
                  <h4 className="font-headline font-semibold text-xs mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Parsed Query Parameters ({queryParams.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-warm)" }}>
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-black/5 dark:bg-white/5">
                        <tr>
                          <th className="p-2.5 font-semibold">Key</th>
                          <th className="p-2.5 font-semibold">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                        {queryParams.map((param, i) => (
                          <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5">
                            <td className="p-2.5 font-bold" style={{ color: "var(--amber-primary)" }}>{param.key}</td>
                            <td className="p-2.5 break-all" style={{ color: "var(--text-primary)" }}>{param.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                <h4>Privacy Guarantee</h4>
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                All URL parsing and percent-encoding run locally inside your browser via standard JavaScript URI algorithms.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
