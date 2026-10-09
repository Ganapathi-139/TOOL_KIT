"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Scissors,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  Shield,
  ChevronRight,
  FilePlus2,
  Minimize2,
  FileType2,
  RotateCw,
  Lock,
  Layers,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";

export default function SplitPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [splitMode, setSplitMode] = useState<"range" | "single">("range");
  const [rangeInput, setRangeInput] = useState<string>("1");
  const [singlePage, setSinglePage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>("");
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = async (selectedFile: File) => {
    setErrorMessage(null);
    setDownloadUrl(null);

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPageCount();

      if (pages === 0) {
        setErrorMessage("The selected PDF document has no pages.");
        return;
      }

      setFile(selectedFile);
      setPageCount(pages);
      setRangeInput(pages > 1 ? `1-${Math.min(pages, 2)}` : "1");
      setSinglePage(1);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("Could not parse this PDF. Please ensure it is unencrypted and not corrupt.");
    }
  };

  // Parse comma-separated page ranges: e.g. "1-3, 5, 8-10"
  const parsePageIndices = (input: string, maxPages: number): number[] => {
    const indices = new Set<number>();
    const parts = input.split(",").map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
          throw new Error(`Invalid range "${part}". Must be between 1 and ${maxPages}.`);
        }
        for (let i = start; i <= end; i++) {
          indices.add(i - 1); // 0-indexed
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
          throw new Error(`Invalid page "${part}". Must be between 1 and ${maxPages}.`);
        }
        indices.add(pageNum - 1);
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file || !pageCount) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let targetIndices: number[] = [];

      if (splitMode === "single") {
        if (singlePage < 1 || singlePage > pageCount) {
          throw new Error(`Selected page must be between 1 and ${pageCount}.`);
        }
        targetIndices = [singlePage - 1];
      } else {
        targetIndices = parsePageIndices(rangeInput, pageCount);
      }

      if (targetIndices.length === 0) {
        throw new Error("Please specify at least one valid page to extract.");
      }

      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);
      const newDoc = await PDFDocument.create();

      const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const newPdfBytes = await newDoc.save();
      const blob = new Blob([newPdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const baseName = file.name.replace(/\.pdf$/i, "");
      const outputName =
        splitMode === "single"
          ? `${baseName}_page_${singlePage}.pdf`
          : `${baseName}_extracted.pdf`;

      setDownloadUrl(url);
      setResultFileName(outputName);
      setResultSize(blob.size);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while splitting the PDF.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const relatedTools = [
    { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
    { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
    { name: "PDF to Word", href: "/tools/pdf/to-word", icon: FileType2 },
    { name: "Rotate PDF", href: "/tools/pdf/rotate", icon: RotateCw },
    { name: "PDF Password Protect", href: "/tools/pdf/protect", icon: Lock },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Split PDF" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Scissors size={16} />
            <span>PDF Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Split PDF
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Extract specific pages or page ranges from any PDF document. Fast, client-side, and private.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Upload Zone */}
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
                  if (e.dataTransfer.files?.[0]) {
                    handleFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
                  isDragging ? "drag-over" : ""
                }`}
                style={{
                  backgroundColor: isDragging ? "var(--amber-tint)" : "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />
                <div
                  className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    color: "var(--amber-primary)",
                  }}
                >
                  <Upload size={26} />
                </div>
                <h3
                  className="font-headline font-semibold text-lg sm:text-xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  Drop a PDF file here to split
                </h3>
                <p
                  className="font-body text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  or click to select a document from your device
                </p>
              </div>
            ) : (
              /* Active File Info & Split Controls */
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* File Header */}
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </p>
                      <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatFileSize(file.size)} · {pageCount} {pageCount === 1 ? "page" : "pages"} total
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFile(null);
                      setPageCount(null);
                      setDownloadUrl(null);
                    }}
                    className="text-xs font-body font-medium hover:underline shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Change file
                  </button>
                </div>

                {/* Mode Selector */}
                <div>
                  <label className="block font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Select Extraction Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSplitMode("range")}
                      className="p-3 rounded-lg border text-left font-body text-sm transition-all"
                      style={{
                        backgroundColor: splitMode === "range" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: splitMode === "range" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: splitMode === "range" ? "var(--amber-primary)" : "var(--text-primary)",
                        fontWeight: splitMode === "range" ? 600 : 400,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Layers size={16} />
                        <span>Page Range</span>
                      </div>
                      <span className="block text-xs mt-1 font-normal" style={{ color: "var(--text-secondary)" }}>
                        Extract multiple ranges (e.g. 1-3, 5)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode("single")}
                      className="p-3 rounded-lg border text-left font-body text-sm transition-all"
                      style={{
                        backgroundColor: splitMode === "single" ? "var(--amber-tint)" : "var(--surface-tinted)",
                        borderColor: splitMode === "single" ? "var(--amber-primary)" : "var(--border-warm)",
                        color: splitMode === "single" ? "var(--amber-primary)" : "var(--text-primary)",
                        fontWeight: splitMode === "single" ? 600 : 400,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Scissors size={16} />
                        <span>Single Page</span>
                      </div>
                      <span className="block text-xs mt-1 font-normal" style={{ color: "var(--text-secondary)" }}>
                        Extract a single specific page
                      </span>
                    </button>
                  </div>
                </div>

                {/* Mode-Specific Input */}
                {splitMode === "range" ? (
                  <div>
                    <label htmlFor="range-input" className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Pages to extract (1 to {pageCount})
                    </label>
                    <input
                      id="range-input"
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder={`e.g. 1-2, 4, 5-${pageCount}`}
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs font-body" style={{ color: "var(--text-muted)" }}>Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => setRangeInput(`1-${pageCount}`)}
                        className="text-xs font-body px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        All Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const evens = Array.from({ length: pageCount || 0 }, (_, i) => i + 1).filter((n) => n % 2 === 0).join(", ");
                          setRangeInput(evens || "2");
                        }}
                        className="text-xs font-body px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        Even Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const odds = Array.from({ length: pageCount || 0 }, (_, i) => i + 1).filter((n) => n % 2 !== 0).join(", ");
                          setRangeInput(odds || "1");
                        }}
                        className="text-xs font-body px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        Odd Pages
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="single-page-select" className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Choose page number (1 to {pageCount})
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="single-page-select"
                        type="number"
                        min={1}
                        max={pageCount || 1}
                        value={singlePage}
                        onChange={(e) => setSinglePage(Math.max(1, Math.min(pageCount || 1, parseInt(e.target.value) || 1)))}
                        className="w-28 px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                        style={{
                          backgroundColor: "var(--bg-warm)",
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <input
                        type="range"
                        min={1}
                        max={pageCount || 1}
                        value={singlePage}
                        onChange={(e) => setSinglePage(parseInt(e.target.value))}
                        className="flex-1 accent-[var(--amber-primary)]"
                      />
                    </div>
                  </div>
                )}

                {/* Split Action */}
                <div className="pt-4 border-t flex justify-end" style={{ borderColor: "var(--border-warm)" }}>
                  <button
                    onClick={handleSplit}
                    disabled={isProcessing}
                    className="px-6 py-2.5 rounded-lg font-body font-semibold text-sm text-white transition-all disabled:opacity-50 flex items-center gap-2"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Extracting pages...</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={16} />
                        <span>Split & Extract</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                className="p-4 rounded-lg border text-sm font-body"
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                  borderColor: "rgba(220, 38, 38, 0.2)",
                  color: "#dc2626",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Download Banner */}
            {downloadUrl && (
              <div
                className="rounded-xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--amber-primary)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                      Your split PDF is ready!
                    </h3>
                    <p className="font-body text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {resultFileName} {resultSize && `· ${formatFileSize(resultSize)}`}
                    </p>
                  </div>
                </div>

                <a
                  href={downloadUrl}
                  download={resultFileName}
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-body font-semibold text-sm text-white transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  <Download size={18} />
                  <span>Download Split PDF</span>
                </a>
              </div>
            )}
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
                How to split a PDF
              </h3>
              <ol className="space-y-4">
                {[
                  "Upload your PDF document by dropping it into the designated box.",
                  "Choose whether to extract a range of pages (e.g. 1-4, 7) or a single page.",
                  "Click ‘Split & Extract’ to compile your new PDF directly in browser memory.",
                  "Download the generated PDF file instantly to your device.",
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
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
                <h4>Client-Side Privacy</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your confidential documents are processed strictly within your browser. No PDF pages are ever uploaded, saved, or inspected by an external server.
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
                Related PDF Tools
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
