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
  Printer,
  FileCheck,
  FileType2,
  ImageDown,
  Minimize2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
  const [fontSize, setFontSize] = useState<number>(11);
  const [lineSpacing, setLineSpacing] = useState<number>(1.35);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFile = (selected: File) => {
    setErrorMessage(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfFileSize(null);
    setHtmlContent("");
    setPageCount(0);

    const ext = selected.name.toLowerCase();
    if (!ext.endsWith(".docx") && !ext.endsWith(".doc")) {
      setErrorMessage("Please select a valid Word document (.docx format).");
      return;
    }

    if (ext.endsWith(".doc") && !ext.endsWith(".docx")) {
      setErrorMessage(
        "Legacy binary .doc files are not natively supported in modern browser parsers. Please save or export your document as .docx in Word or Google Docs before converting."
      );
      return;
    }

    setFile(selected);
  };

  const convertWordToPdf = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiRes = await fetch("/api/word-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!apiRes.ok) {
        const errJson = await apiRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${apiRes.status}`);
      }

      const pdfBlob = await apiRes.blob();
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Converted PDF document is empty.");
      }

      const url = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(url);
      setPdfFileSize(pdfBlob.size);

      try {
        const arr = await pdfBlob.arrayBuffer();
        const loadedDoc = await PDFDocument.load(arr);
        setPageCount(loadedDoc.getPageCount());
      } catch {
        setPageCount(1);
      }
    } catch (err: unknown) {
      console.error("Word to PDF conversion failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Word to PDF conversion failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintPreview = () => {
    if (!htmlContent) return;

    const iframe = printFrameRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${file?.name || "Document"} - Print to PDF</title>
          <style>
            @page {
              size: ${pageSize.toUpperCase()};
              margin: 20mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: ${fontSize}pt;
              line-height: ${lineSpacing};
              color: #1a1a1a;
              margin: 0;
              padding: 10px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #111;
              font-weight: 700;
              page-break-after: avoid;
            }
            img {
              max-width: 100%;
              height: auto;
              page-break-inside: avoid;
              display: block;
              margin: 10px auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              page-break-inside: avoid;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px 12px;
              text-align: left;
            }
            p {
              margin: 0 0 10px 0;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "PDF Tools", href: "/tools/pdf" },
            { label: "Word to PDF" },
          ]}
        />

        {/* Hidden iframe for native vector print preview */}
        <iframe
          ref={printFrameRef}
          title="Print Preview Frame"
          className="hidden"
          style={{ position: "fixed", right: "-9999px", bottom: "-9999px" }}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <FileType2 size={16} />
            <span>PDF Tools</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Word to PDF Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert Microsoft Word (.docx) documents into clean, paginated PDF files directly in your browser with private client-side processing.
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
          {/* Main Area */}
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
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                  Choose a Word document or drag it here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
                  Supports Microsoft Word .docx files up to 50MB
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Browse Files
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
                      <FileType2 size={20} />
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
                      setPdfBlobUrl(null);
                      setHtmlContent("");
                    }}
                    className="font-body text-xs font-medium hover:underline"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Change document
                  </button>
                </div>

                {/* Conversion Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Target Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as "a4" | "letter")}
                      className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="a4">A4 (210 × 297 mm)</option>
                      <option value="letter">US Letter (8.5 × 11 in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Font Size
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="10">10 pt (Compact)</option>
                      <option value="11">11 pt (Standard)</option>
                      <option value="12">12 pt (Large)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-body text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Line Spacing
                    </label>
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(Number(e.target.value))}
                      className="w-full rounded-lg border px-3 py-2 font-body text-sm"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="1.2">1.2 (Tight)</option>
                      <option value="1.35">1.35 (Normal)</option>
                      <option value="1.6">1.6 (Relaxed)</option>
                    </select>
                  </div>
                </div>

                {/* Convert Button */}
                {!pdfBlobUrl && (
                  <button
                    type="button"
                    onClick={convertWordToPdf}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Extracting & Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck size={18} />
                        <span>Convert to PDF</span>
                      </>
                    )}
                  </button>
                )}

                {/* Conversion Success & Actions */}
                {pdfBlobUrl && (
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
                          Conversion Complete
                        </p>
                        <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>
                          {pageCount} {pageCount === 1 ? "page" : "pages"} • {pdfFileSize ? formatFileSize(pdfFileSize) : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handlePrintPreview}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border font-body text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                        title="Open system print dialog with high-fidelity vector styling"
                      >
                        <Printer size={15} />
                        <span>Print / Vector PDF</span>
                      </button>

                      <a
                        href={pdfBlobUrl}
                        download={`${file.name.replace(/\.[^/.]+$/, "")}.pdf`}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-body font-semibold text-xs text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={15} />
                        <span>Download PDF</span>
                      </a>
                    </div>
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
                <strong className="font-semibold text-primary">100% Client-Side Conversion:</strong> Your Word files are parsed directly inside your browser using Web Workers. No document data is ever sent to or stored on any server.
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
                Supported Elements
              </h3>
              <ul className="space-y-2.5 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Full paragraph text, headings (H1–H6), and typography.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Embedded photos, diagrams, and inline illustrations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Bulleted lists, numbered lists, and bold/italic styles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Standard data tables and line breaks.</span>
                </li>
              </ul>

              <div
                className="mt-4 p-3 rounded-lg border text-xs font-body"
                style={{
                  backgroundColor: "var(--surface-tinted)",
                  borderColor: "var(--border-warm)",
                  color: "var(--text-muted)",
                }}
              >
                <strong className="text-primary block mb-1">Format Disclosure:</strong>
                Complex proprietary shapes, macros, and SmartArt are rendered as clean standardized text and tables.
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
                  { name: "PDF to Word", href: "/tools/pdf/to-word", icon: FileType2 },
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FileText },
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: Minimize2 },
                  { name: "Image to PDF", href: "/tools/pdf/image-to-pdf", icon: ImageDown },
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
