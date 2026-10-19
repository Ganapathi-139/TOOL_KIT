"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ListOrdered,
  Upload,
  Download,
  Shield,
  ChevronRight,
  FileText,
  Loader2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Trash2,
  FilePlus2,
  Scissors,
  RotateCw,
  ImageDown,
  Minimize2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";

interface PageItem {
  originalIndex: number;
  label: string;
}

export default function ReorderPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  const [processedPdfSize, setProcessedPdfSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setProcessedPdfUrl(null);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file (.pdf).");
      return;
    }

    try {
      const buffer = await selected.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      const pageList: PageItem[] = [];
      for (let i = 0; i < count; i++) {
        pageList.push({
          originalIndex: i,
          label: `Page ${i + 1}`,
        });
      }

      setFile(selected);
      setPages(pageList);
    } catch (err: unknown) {
      console.error("PDF read error:", err);
      setErrorMessage("Could not parse PDF. Document may be encrypted or corrupted.");
    }
  };

  const movePage = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const updated = [...pages];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setPages(updated);
    setProcessedPdfUrl(null);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      setErrorMessage("PDF must contain at least 1 page.");
      return;
    }
    const updated = pages.filter((_, idx) => idx !== index);
    setPages(updated);
    setProcessedPdfUrl(null);
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const pageIndicesToCopy = pages.map((p) => p.originalIndex);
      const copiedPages = await newDoc.copyPages(sourceDoc, pageIndicesToCopy);

      copiedPages.forEach((cp) => newDoc.addPage(cp));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setProcessedPdfUrl(url);
      setProcessedPdfSize(blob.size);
    } catch (err: unknown) {
      console.error("Reorder error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save reordered PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Reorder & Delete Pages" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <ListOrdered size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Reorder & Delete PDF Pages
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Rearrange the sequence of pages in your PDF or delete unwanted pages before exporting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging ? "border-amber-500 scale-[0.99]" : ""
                }`}
                style={{
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                  backgroundColor: isDragging ? "var(--amber-tint)" : "var(--surface)",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    color: "var(--amber-primary)",
                  }}
                >
                  <Upload size={24} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Choose a PDF file to reorder
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Move pages up/down or remove unwanted pages directly in-browser.
                </p>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  Select PDF File
                </button>
              </div>
            ) : (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {pages.length} Pages remaining · {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setProcessedPdfUrl(null);
                    }}
                    className="font-body text-xs text-red-500 hover:underline"
                  >
                    Change File
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
                  {pages.map((p, idx) => (
                    <div
                      key={`${p.originalIndex}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-headline font-bold text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/5" style={{ color: "var(--amber-primary)" }}>
                          #{idx + 1}
                        </span>
                        <span className="font-body text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {p.label} (Original #{p.originalIndex + 1})
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePage(idx, "up")}
                          disabled={idx === 0}
                          aria-label={`Move page ${idx + 1} up`}
                          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePage(idx, "down")}
                          disabled={idx === pages.length - 1}
                          aria-label={`Move page ${idx + 1} down`}
                          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <ArrowDown size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePage(idx)}
                          aria-label={`Delete page ${idx + 1}`}
                          className="p-1 rounded hover:bg-red-500/10 text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-lg font-headline font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--amber-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving PDF...
                    </>
                  ) : (
                    <>
                      <ListOrdered size={18} />
                      Export Reordered PDF ({pages.length} Pages)
                    </>
                  )}
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                className="p-4 rounded-xl border font-body text-sm"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                }}
              >
                {errorMessage}
              </div>
            )}

            {processedPdfUrl && (
              <div
                className="p-6 rounded-xl border flex flex-col gap-4"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "rgba(34, 197, 94, 0.3)",
                }}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-500 shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                        Reordered PDF is ready!
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {pages.length} pages · {processedPdfSize ? formatFileSize(processedPdfSize) : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-4 py-2.5 rounded-lg border font-body text-sm font-medium flex items-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                        backgroundColor: showPreview ? "var(--amber-tint)" : "var(--surface-tinted)",
                      }}
                    >
                      {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span>{showPreview ? "Hide Preview" : "Preview PDF"}</span>
                    </button>

                    <a
                      href={processedPdfUrl}
                      download={`reordered-${file?.name || "document.pdf"}`}
                      className="px-6 py-2.5 rounded-lg font-body text-sm font-semibold flex items-center justify-center gap-2 transition-all text-white"
                      style={{
                        backgroundColor: "var(--amber-primary)",
                      }}
                    >
                      <Download size={16} />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>

                {showPreview && (
                  <div
                    className="border rounded-xl overflow-hidden mt-2"
                    style={{ borderColor: "var(--border-warm)", height: "540px" }}
                  >
                    <iframe
                      src={processedPdfUrl}
                      title="Reordered PDF Preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                )}
              </div>
            )}
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
                Page reordering and culling execute in memory. No documents are uploaded or indexed.
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
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                  { name: "Split PDF", href: "/tools/pdf/split", icon: Scissors },
                  { name: "Rotate PDF", href: "/tools/pdf/rotate", icon: RotateCw },
                  { name: "Image to PDF", href: "/tools/pdf/image-to-pdf", icon: ImageDown },
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
                ].map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <t.icon size={16} style={{ color: "var(--amber-primary)" }} />
                      <span>{t.name}</span>
                    </div>
                    <ChevronRight size={14} />
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
