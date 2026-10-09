"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Icon } from "@/components/Icon";
import type { Tool, Category } from "@/lib/tools-data";
import {
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Shield,
  ChevronRight,
} from "lucide-react";

interface Props {
  tool: Tool;
  category: Category;
  relatedTools: Tool[];
}

export function ToolClientView({ tool, category, relatedTools }: Props) {
  const toolId = tool.href.split("/").pop();

  // Word counter state
  const [wordText, setWordText] = useState("");

  // Base64 state
  const [base64Mode, setBase64Mode] = useState<"encode" | "decode">("encode");
  const [base64Input, setBase64Input] = useState("");
  const [base64Output, setBase64Output] = useState("");
  const [copiedBase64, setCopiedBase64] = useState(false);

  // Pomodoro state
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Base64 logic
  useEffect(() => {
    if (toolId === "base64") {
      try {
        if (!base64Input) {
          setBase64Output("");
          return;
        }
        if (base64Mode === "encode") {
          setBase64Output(btoa(unescape(encodeURIComponent(base64Input))));
        } else {
          setBase64Output(decodeURIComponent(escape(atob(base64Input))));
        }
      } catch {
        setBase64Output("Invalid format for Base64 operation.");
      }
    }
  }, [base64Input, base64Mode, toolId]);

  // Pomodoro logic
  useEffect(() => {
    if (toolId === "pomodoro") {
      if (pomoRunning) {
        timerRef.current = setInterval(() => {
          setPomoSeconds((prev) => {
            if (prev <= 1) {
              setPomoRunning(false);
              return 25 * 60;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [pomoRunning, toolId]);

  // Word counter statistics
  const cleanText = wordText.trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = wordText.length;
  const charNoSpaces = wordText.replace(/\s+/g, "").length;
  const sentenceCount = cleanText ? (cleanText.match(/[.!?]+(\s|$)/g) || []).length : 0;
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: category.name, href: category.href },
            { label: tool.name },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Icon name={tool.icon} size={16} />
            <span>{category.name}</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {tool.name}
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            {tool.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main workspace */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Tool: Word Counter */}
            {toolId === "word-counter" && (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Words", value: wordCount },
                    { label: "Characters", value: charCount },
                    { label: "No spaces", value: charNoSpaces },
                    { label: "Sentences", value: sentenceCount },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl border text-center"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      <p
                        className="font-headline font-bold text-2xl"
                        style={{ color: "var(--amber-primary)" }}
                      >
                        {stat.value}
                      </p>
                      <p
                        className="font-body text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="word-textarea-input"
                    className="block font-body text-sm font-medium mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Type or paste text to inspect
                  </label>
                  <textarea
                    id="word-textarea-input"
                    rows={8}
                    value={wordText}
                    onChange={(e) => setWordText(e.target.value)}
                    placeholder="Start typing or paste your essay, article, or notes here..."
                    className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-body" style={{ color: "var(--text-muted)" }}>
                  <span>Est. Reading Time: ~{readingTimeMinutes} min</span>
                  {wordText && (
                    <button
                      onClick={() => setWordText("")}
                      className="hover:underline"
                      style={{ color: "var(--amber-primary)" }}
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tool: Base64 Encoder / Decoder */}
            {toolId === "base64" && (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBase64Mode("encode")}
                    className="px-4 py-2 rounded-lg text-sm font-medium font-body transition-colors"
                    style={{
                      backgroundColor: base64Mode === "encode" ? "var(--amber-primary)" : "var(--surface-tinted)",
                      color: base64Mode === "encode" ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    Encode to Base64
                  </button>
                  <button
                    onClick={() => setBase64Mode("decode")}
                    className="px-4 py-2 rounded-lg text-sm font-medium font-body transition-colors"
                    style={{
                      backgroundColor: base64Mode === "decode" ? "var(--amber-primary)" : "var(--surface-tinted)",
                      color: base64Mode === "decode" ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    Decode from Base64
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="base64-text-input"
                    className="block font-body text-sm font-medium mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {base64Mode === "encode" ? "Input String" : "Base64 String"}
                  </label>
                  <textarea
                    id="base64-text-input"
                    rows={4}
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder={
                      base64Mode === "encode"
                        ? "Enter string to encode..."
                        : "Enter Base64 text to decode..."
                    }
                    className="w-full px-4 py-3 rounded-xl border font-mono text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="base64-text-output"
                      className="block font-body text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Result
                    </label>
                    {base64Output && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(base64Output);
                          setCopiedBase64(true);
                          setTimeout(() => setCopiedBase64(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium font-body hover:underline"
                        style={{ color: "var(--amber-primary)" }}
                      >
                        {copiedBase64 ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedBase64 ? "Copied" : "Copy Result"}</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    id="base64-text-output"
                    readOnly
                    rows={4}
                    value={base64Output}
                    placeholder="Result will appear here..."
                    className="w-full px-4 py-3 rounded-xl border font-mono text-sm focus:outline-none cursor-text"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tool: Pomodoro Timer */}
            {toolId === "pomodoro" && (
              <div
                className="rounded-xl border p-8 flex flex-col items-center text-center gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div
                  className="font-headline font-bold text-6xl sm:text-7xl tracking-tighter"
                  style={{ color: "var(--text-primary)" }}
                >
                  {String(Math.floor(pomoSeconds / 60)).padStart(2, "0")}:
                  {String(pomoSeconds % 60).padStart(2, "0")}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPomoRunning(!pomoRunning)}
                    className="px-6 py-3 rounded-xl font-body font-semibold text-sm text-white flex items-center gap-2 transition-transform hover:scale-105"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {pomoRunning ? <Pause size={18} /> : <Play size={18} />}
                    <span>{pomoRunning ? "Pause" : "Start Focus"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoSeconds(25 * 60);
                    }}
                    className="p-3 rounded-xl border transition-colors"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-secondary)",
                    }}
                    aria-label="Reset timer"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoSeconds(25 * 60);
                    }}
                    className="text-xs font-body font-medium px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                  >
                    25 min Focus
                  </button>
                  <button
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoSeconds(5 * 60);
                    }}
                    className="text-xs font-body font-medium px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                  >
                    5 min Short Break
                  </button>
                  <button
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoSeconds(15 * 60);
                    }}
                    className="text-xs font-body font-medium px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                  >
                    15 min Long Break
                  </button>
                </div>
              </div>
            )}

            {/* Other tools: Interactive Container */}
            {toolId !== "word-counter" && toolId !== "base64" && toolId !== "pomodoro" && (
              <div
                className="rounded-xl border p-8 text-center flex flex-col items-center gap-4"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    color: "var(--amber-primary)",
                  }}
                >
                  <Sparkles size={26} />
                </div>
                <h3
                  className="font-headline font-semibold text-xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  {tool.name}
                </h3>
                <p
                  className="font-body text-sm max-w-md"
                  style={{ color: "var(--text-secondary)" }}
                >
                  This module is scheduled for our next roadmap update. Please select from our active tools or explore the related modules on the right.
                </p>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-body text-xs font-medium"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>In Development</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
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
                Processed entirely on your device. Nothing leaves your browser or gets stored on external servers.
              </p>
            </div>

            {relatedTools.length > 0 && (
              <div
                className="rounded-xl border p-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <h4 className="font-headline font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                  Related in {category.name}
                </h4>
                <div className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                  {relatedTools.map((rel) => (
                    <Link
                      key={rel.id}
                      href={rel.href}
                      className="py-2.5 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon name={rel.icon} size={15} style={{ color: "var(--amber-primary)" }} />
                        <span
                          className="font-body text-xs group-hover:text-[var(--amber-primary)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {rel.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
