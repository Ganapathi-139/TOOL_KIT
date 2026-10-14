"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
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
  FilePlus2,
  Scissors,
  RotateCw,
  Sparkles,
  FileText,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const renderContainerRef = useRef<HTMLDivElement>(null);

  // Clean up object URLs on unmount or file reset
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Dynamically load Mammoth.js and html2pdf.js scripts
  useEffect(() => {
    const loadScript = (src: string, fallbackSrc: string, checkName: "mammoth" | "html2pdf") => {
      if (typeof window === "undefined" || (window as unknown as Record<string, unknown>)[checkName]) {
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onerror = () => {
        const fallback = document.createElement("script");
        fallback.src = fallbackSrc;
        fallback.async = true;
        document.body.appendChild(fallback);
      };
      document.body.appendChild(script);
    };

    loadScript(
      "/js/mammoth.browser.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js",
      "mammoth"
    );
    loadScript(
      "/js/html2pdf.bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
      "html2pdf"
    );
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const waitForEngines = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    for (let i = 0; i < 30; i++) {
      if (window.mammoth && window.html2pdf) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return Boolean(window.mammoth && window.html2pdf);
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfFileSize(null);
    setHtmlContent("");
    setConversionStatus("");

    const ext = selected.name.toLowerCase();
    if (!ext.endsWith(".docx") && !ext.endsWith(".doc")) {
      setErrorMessage("Please select a valid Word document (.docx format).");
      return;
    }

    if (ext.endsWith(".doc") && !ext.endsWith(".docx")) {
      setErrorMessage(
        "Legacy binary .doc files are not supported by modern web browser parsers. Please open your document in Microsoft Word, Google Docs, or LibreOffice and choose 'Save As .docx' before converting."
      );
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setConversionStatus("Reading Word document (.docx)...");

    try {
      const ready = await waitForEngines();
      if (!ready || !window.mammoth) {
        throw new Error("Word processing engine is still initializing. Please wait a few seconds and try again.");
      }

      const buffer = await selected.arrayBuffer();
      setConversionStatus("Extracting document text, tables, and images with Mammoth...");

      const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
      const html = result.value;

      if (!html || !html.trim()) {
        throw new Error("The Word document appears to be empty or contains unsupported content.");
      }

      setHtmlContent(html);
      setConversionStatus("Document loaded! Click 'Convert to PDF' below to generate your PDF.");
    } catch (err: unknown) {
      console.error("Word parsing failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to read the Word document. Please ensure it is a valid .docx file."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const convertWordToPdf = async () => {
    if (!file || !htmlContent) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setConversionStatus("Rendering high-definition PDF...");

    try {
      const ready = await waitForEngines();
      if (!ready || !window.html2pdf) {
        throw new Error("PDF generation library is still loading. Please try again in a few moments.");
      }

      const container = renderContainerRef.current;
      if (!container) {
        throw new Error("Document preview container not found. Please try re-selecting your file.");
      }

      const opt = {
        margin: [10, 10, 10, 10], // 10mm margins
        filename: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: { unit: "mm", format: pageSize, orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"] },
      };

      const pdfBlob: Blob = await window.html2pdf().set(opt).from(container).outputPdf("blob");

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      const url = URL.createObjectURL(pdfBlob);

      setPdfBlobUrl(url);
      setPdfFileSize(pdfBlob.size);
      setConversionStatus("Conversion complete!");
    } catch (err: unknown) {
      console.error("Word to PDF generation failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate PDF. Please try the 'Print / Vector PDF' option."
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
          <title>${file?.name || "Document"} - PDF Export</title>
          <style>
            @page {
              size: ${pageSize.toUpperCase()};
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #111827;
              margin: 0;
              padding: 10px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #0f172a;
              font-weight: 700;
              page-break-after: avoid;
              margin-top: 18px;
              margin-bottom: 8px;
            }
            p { margin: 0 0 12px 0; }
            img {
              max-width: 100%;
              height: auto;
              page-break-inside: avoid;
              display: block;
              margin: 12px auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              page-break-inside: avoid;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 600;
            }
            ul, ol {
              margin: 8px 0 12px 24px;
              padding-left: 8px;
            }
            li { margin-bottom: 4px; }
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
    }, 400);
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

        {/* Hidden print iframe */}
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
            Convert Microsoft Word documents (.docx) into beautiful, paginated PDF files with full fidelity for text, formatting, tables, and images.
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
                    e.target.value = "";
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
                  Choose a Word document (.docx)
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  Converts locally in your browser with high fidelity formatting and images.
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
                      <h4 className="font-headline font-semibold text-sm sm:text-base truncate max-w-xs sm:max-w-md" style={{ color: "var(--text-primary)" }}>
                        {file.name}
                      </h4>
                      <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl(null);
                      setHtmlContent("");
                    }}
                    className="font-body text-xs font-medium text-red-500 hover:underline"
                  >
                    Change document
                  </button>
                </div>

                {/* Conversion Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      Target Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as "a4" | "letter")}
                      className="w-full rounded-xl border px-3 py-2.5 font-body text-sm"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="a4">A4 (210 × 297 mm) — Standard</option>
                      <option value="letter">US Letter (8.5 × 11 in)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div
                      className="w-full p-2.5 rounded-xl border flex items-center gap-2 text-xs font-body"
                      style={{
                        backgroundColor: "var(--surface-tinted)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <Sparkles size={16} style={{ color: "var(--amber-primary)" }} />
                      <span>Engine: Mammoth.js + html2pdf</span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                {isProcessing && (
                  <div
                    className="p-4 rounded-xl border flex items-center gap-3"
                    style={{
                      backgroundColor: "var(--amber-tint)",
                      borderColor: "rgba(200, 123, 58, 0.25)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Loader2 size={18} className="animate-spin shrink-0 text-amber-500" />
                    <span className="font-body text-xs sm:text-sm font-medium">{conversionStatus}</span>
                  </div>
                )}

                {/* Convert Button */}
                {htmlContent && !pdfBlobUrl && (
                  <button
                    type="button"
                    onClick={convertWordToPdf}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck size={18} />
                        <span>Convert & Download PDF</span>
                      </>
                    )}
                  </button>
                )}

                {/* Conversion Success & Actions */}
                {pdfBlobUrl && (
                  <div
                    className="p-5 rounded-2xl border flex flex-col gap-4"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "rgba(34, 197, 94, 0.35)",
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-500 bg-emerald-500/10">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="font-headline font-bold text-base" style={{ color: "var(--text-primary)" }}>
                            Word Document Converted Successfully!
                          </p>
                          <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                            PDF Output: {pdfFileSize ? formatFileSize(pdfFileSize) : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href={pdfBlobUrl}
                        download={`${file.name.replace(/\.[^/.]+$/, "")}.pdf`}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={16} />
                        <span>Download PDF</span>
                      </a>

                      <button
                        type="button"
                        onClick={handlePrintPreview}
                        className="px-4 py-3 rounded-xl border font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                        title="Print or save as vector PDF"
                      >
                        <Printer size={16} />
                        <span>Print / Vector PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={convertWordToPdf}
                        disabled={isProcessing}
                        className="px-4 py-3 rounded-xl border font-body text-xs font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ml-auto"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      >
                        Re-generate PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Visible Document Preview Paper Sheet */}
                {htmlContent && (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} style={{ color: "var(--amber-primary)" }} />
                        <span className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          Document Content Preview
                        </span>
                      </div>
                      <span className="text-xs font-body text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium">
                        Ready to convert
                      </span>
                    </div>

                    {/* Paper Document Container with authentic typography */}
                    <div
                      ref={renderContainerRef}
                      className="border rounded-xl shadow-sm"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#1e293b",
                        borderColor: "var(--border-warm)",
                        padding: "36px 48px",
                        boxSizing: "border-box",
                        width: "100%",
                        maxWidth: pageSize === "a4" ? "800px" : "820px",
                        margin: "0 auto",
                      }}
                    >
                      <style>{`
                        .word-document-sheet {
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                          font-size: 11pt;
                          line-height: 1.6;
                          color: #1e293b;
                          width: 100%;
                          word-wrap: break-word;
                          overflow-wrap: break-word;
                        }
                        .word-document-sheet h1 { font-size: 20pt; font-weight: 700; color: #0f172a; margin: 18px 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; page-break-after: avoid; }
                        .word-document-sheet h2 { font-size: 16pt; font-weight: 700; color: #1e293b; margin: 16px 0 8px 0; page-break-after: avoid; }
                        .word-document-sheet h3 { font-size: 13pt; font-weight: 600; color: #334155; margin: 12px 0 6px 0; page-break-after: avoid; }
                        .word-document-sheet p { margin: 0 0 12px 0; color: #1e293b; }
                        .word-document-sheet table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; page-break-inside: avoid; }
                        .word-document-sheet th, .word-document-sheet td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
                        .word-document-sheet th { background-color: #f8fafc; font-weight: 600; }
                        .word-document-sheet img { max-width: 100%; height: auto; display: block; margin: 14px auto; border-radius: 4px; }
                        .word-document-sheet ul, .word-document-sheet ol { margin: 8px 0 12px 24px; padding-left: 8px; }
                        .word-document-sheet li { margin-bottom: 4px; }
                        .word-document-sheet strong { font-weight: 700; color: #0f172a; }
                        .word-document-sheet em { font-style: italic; }
                      `}</style>
                      <div
                        className="word-document-sheet"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Card */}
            <div
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
              >
                <Shield size={18} />
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong className="font-semibold text-primary">100% Client-Side Privacy:</strong> Your Word files never touch any external server. Everything is decoded and rendered directly in your browser.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-2xl border p-6"
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
                  <span>Headings (H1 to H6) and paragraph styling.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Embedded photos, screenshots, and inline diagrams.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Bulleted lists, numbered lists, bold, italics, and underlines.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>Data tables with borders and styled header rows.</span>
                </li>
              </ul>
            </div>

            <div
              className="rounded-2xl border p-6"
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
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: FileType2 },
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                  { name: "Split PDF", href: "/tools/pdf/split", icon: Scissors },
                  { name: "Rotate PDF", href: "/tools/pdf/rotate", icon: RotateCw },
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
