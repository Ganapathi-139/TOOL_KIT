"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Download,
  Shield,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileType2,
  FilePlus2,
  ImageDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";




export default function PdfToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [includePageDividers, setIncludePageDividers] = useState(true);
  const [pageCount, setPageCount] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Dynamically load PDF.js client-side script
    if (typeof window !== "undefined" && !window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFile = (selected: File) => {
    setErrorMessage(null);
    setExtractedText("");
    setPageCount(0);
    setWordCount(0);
    setCharCount(0);

    const ext = selected.name.toLowerCase();
    if (!ext.endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file.");
      return;
    }

    setFile(selected);
  };

  const extractTextFromPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (!window.pdfjsLib) {
        throw new Error("PDF processing engine is still initializing. Please wait 2 seconds and try again.");
      }

      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const loadingTask = window.pdfjsLib.getDocument({ data: uint8 });
      const pdf = await loadingTask.promise;

      setPageCount(pdf.numPages);
      const pagesText: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Sort items by vertical Y coordinate descending (top to bottom), then X ascending (left to right)
        const sortedItems = [...textContent.items].sort((a, b) => {
          const yA = a.transform[5];
          const yB = b.transform[5];
          if (Math.abs(yA - yB) > 4) {
            return yB - yA; // higher Y first
          }
          return a.transform[4] - b.transform[4]; // left to right
        });

        // Group into lines based on vertical proximity
        const lines: string[] = [];
        let currentLine = "";
        let currentY = -1;

        for (const item of sortedItems) {
          const itemY = item.transform[5];
          if (currentY === -1 || Math.abs(itemY - currentY) > 5) {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = item.str;
            currentY = itemY;
          } else {
            currentLine += (currentLine.endsWith(" ") || item.str.startsWith(" ") ? "" : " ") + item.str;
          }
        }
        if (currentLine.trim()) lines.push(currentLine.trim());

        const pageFormatted = lines.join("\n");
        if (includePageDividers) {
          pagesText.push(`--- Page ${i} ---\n\n${pageFormatted}`);
        } else {
          pagesText.push(pageFormatted);
        }
      }

      const combined = pagesText.join("\n\n");
      setExtractedText(combined);

      // Compute statistics
      const cleanText = combined.trim();
      const words = cleanText ? cleanText.split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(cleanText.length);
    } catch (err: unknown) {
      console.error("Text extraction failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to extract text from PDF document."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "PDF to Plain Text" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <FileText size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            PDF to Plain Text (.txt)
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Extract all text, paragraphs, and contents from any PDF document into clean, searchable plain text with zero data uploads.
          </p>
        </div>

        {errorMessage && (
          <div
            className="mb-8 p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              borderColor: "rgba(239, 68, 68, 0.25)",
              color: "#dc2626",
            }}
          >
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm font-body">
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Workspace */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${
                  isDragging ? "scale-[0.99] border-amber-500 bg-amber-500/5" : "hover:border-amber-500/50"
                }`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                >
                  <Upload size={28} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Choose a PDF file or drag it here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
                  Extract text from documents, reports, receipts, and e-books
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Select PDF
                </button>
              </div>
            ) : (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* File Header */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-sm truncate max-w-xs sm:max-w-md" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setExtractedText("");
                    }}
                    className="font-body text-xs font-medium hover:underline"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Change file
                  </button>
                </div>

                {/* Settings */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="page-dividers"
                    checked={includePageDividers}
                    onChange={(e) => setIncludePageDividers(e.target.checked)}
                    className="rounded accent-amber-600"
                  />
                  <label htmlFor="page-dividers" className="font-body text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                    Include page markers (e.g. <span className="font-mono">--- Page 1 ---</span>)
                  </label>
                </div>

                {/* Extract Button */}
                {!extractedText && (
                  <button
                    type="button"
                    onClick={extractTextFromPdf}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Extracting Unicode Text...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={18} />
                        <span>Extract All Text</span>
                      </>
                    )}
                  </button>
                )}

                {/* Extraction Summary */}
                {extractedText && (
                  <div
                    className="p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-500 bg-emerald-500/10">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          Extraction Complete
                        </p>
                        <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                          {pageCount} {pageCount === 1 ? "page" : "pages"} • {wordCount.toLocaleString()} words • {charCount.toLocaleString()} characters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border font-body text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copied ? "Copied!" : "Copy Text"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownload}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-body font-semibold text-xs text-white flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={14} />
                        <span>Download .txt</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Extracted Text Area */}
                {extractedText && (
                  <div>
                    <label className="block font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      Text Preview & Editor
                    </label>
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      rows={14}
                      className="w-full p-4 rounded-xl border font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                      placeholder="Extracted text will appear here..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Privacy Card */}
            <div
              className="rounded-xl border p-4 flex items-center gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
              >
                <Shield size={16} />
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong className="font-semibold text-primary">Private Browser Extraction:</strong> Text is parsed locally with client-side PDF decompilers. Your sensitive documents never leave your computer.
              </p>
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
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Text vs Scanned PDFs
              </h3>
              <p className="text-xs font-body leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                This tool instantly extracts native Unicode characters from text-based PDFs (e.g. exported Word docs, certificates, research papers).
              </p>
              <div
                className="p-3 rounded-lg border text-xs font-body"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-muted)",
                }}
              >
                <strong className="text-primary block mb-1">OCR Requirement Note:</strong>
                If your PDF is a flat image scan (such as a camera photo of a physical paper without embedded text layers), optical character recognition (OCR) is required to recognize letters.
              </div>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Related PDF Tools
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { name: "Plain Text to PDF", href: "/tools/pdf/text-to-pdf", icon: FileText },
                  { name: "PDF to Word (.docx)", href: "/tools/pdf/to-word", icon: FileType2 },
                  { name: "PDF to JPG", href: "/tools/pdf/to-jpg", icon: ImageDown },
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-body group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={15} style={{ color: "var(--amber-primary)" }} />
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-muted)" }} />
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
