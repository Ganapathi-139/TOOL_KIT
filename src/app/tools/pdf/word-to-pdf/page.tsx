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
  Layers,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";




export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [hasRenderedDoc, setHasRenderedDoc] = useState<boolean>(false);
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load mammoth and docx-preview on mount
  useEffect(() => {
    const loadScript = (src: string, fallback: string, onLoad: () => void) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = onLoad;
      s.onerror = () => {
        const f = document.createElement("script");
        f.src = fallback;
        f.async = true;
        f.onload = onLoad;
        f.onerror = onLoad;
        document.body.appendChild(f);
      };
      document.body.appendChild(s);
    };

    if (!window.mammoth) {
      loadScript(
        "/js/mammoth.browser.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js",
        () => {}
      );
    }

    if (!window.docx) {
      loadScript(
        "/js/jszip.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
        () => {
          loadScript(
            "/js/docx-preview.min.js",
            "https://cdn.jsdelivr.net/npm/docx-preview@0.3.4/dist/docx-preview.min.js",
            () => {}
          );
        }
      );
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const waitForLib = async (check: () => boolean, maxMs = 8000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (check()) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setHasRenderedDoc(false);
    setRenderedHtml("");
    setPageCount(0);
    setConversionStatus("");

    const name = selected.name.toLowerCase();
    if (!name.endsWith(".docx") && !name.endsWith(".doc")) {
      setErrorMessage("Please select a valid Word document (.docx format).");
      return;
    }
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      setErrorMessage(
        "Legacy .doc files are not supported. Please save as .docx in Word, Google Docs, or LibreOffice first."
      );
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setConversionStatus("Reading Word document...");

    try {
      const buffer = await selected.arrayBuffer();

      // Try docx-preview first (proper pagination)
      const docxReady = await waitForLib(() => !!window.docx);
      if (docxReady && window.docx) {
        setConversionStatus("Rendering document pages...");
        const tempDiv = document.createElement("div");
        tempDiv.style.cssText = "position:fixed;top:-99999px;left:-99999px;width:210mm;visibility:hidden;";
        document.body.appendChild(tempDiv);

        await window.docx.renderAsync(buffer, tempDiv, null, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderEndnotes: true,
        });

        const pages = tempDiv.querySelectorAll(".docx-wrapper > section, .docx-wrapper > article, .docx-page");
        const count = pages.length || 1;
        setPageCount(count);
        const html = tempDiv.innerHTML;
        document.body.removeChild(tempDiv);
        setRenderedHtml(html);
        setHasRenderedDoc(true);
        setConversionStatus(`Document ready: ${count} ${count === 1 ? "page" : "pages"}. Click "Download PDF" below.`);
      } else {
        // Fallback: mammoth
        const mammothReady = await waitForLib(() => !!window.mammoth);
        if (!mammothReady) throw new Error("Document engine unavailable. Please refresh the page.");
        setConversionStatus("Converting document content...");
        const result = await window.mammoth!.convertToHtml({ arrayBuffer: buffer });
        const html = `<div class="docx-fallback-wrapper">${result.value}</div>`;
        setRenderedHtml(html);
        setPageCount(1);
        setHasRenderedDoc(true);
        setConversionStatus(`Document ready. Click "Download PDF" below.`);
      }
    } catch (err: unknown) {
      console.error("Render error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to read the Word document. Ensure it is a valid .docx file."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!renderedHtml || !file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) {
      setErrorMessage("Pop-up was blocked. Please allow pop-ups for this site and try again.");
      return;
    }

    printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${fileName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 0; }
    html, body {
      margin: 0; padding: 0; background: #fff;
      font-family: "Calibri", "Segoe UI", Arial, sans-serif;
      font-size: 11pt; color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .docx-wrapper {
      background: #fff !important;
      padding: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 0 !important;
    }
    .docx-wrapper > section,
    .docx-wrapper > article,
    .docx-page {
      background: #fff !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      width: 210mm !important;
      min-height: 297mm !important;
      page-break-after: always !important;
      break-after: page !important;
      overflow: hidden !important;
    }
    .docx-wrapper > section:last-child,
    .docx-wrapper > article:last-child,
    .docx-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .docx-fallback-wrapper {
      padding: 25.4mm; width: 210mm;
      min-height: 297mm; margin: 0 auto; background: #fff;
    }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #888; padding: 4px 8px; }
    img { max-width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  ${renderedHtml}
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 800); };
  </script>
</body>
</html>`);
    printWin.document.close();
  };

  const resetTool = () => {
    setFile(null);
    setHasRenderedDoc(false);
    setRenderedHtml("");
    setPageCount(0);
    setConversionStatus("");
    setErrorMessage(null);
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
            Convert Word documents (.docx) to PDF. Every page in the Word file becomes exactly one page in the PDF — no cutting, no extra borders, no reformatting.
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
            <div className="text-sm font-body flex-1">
              <p className="font-semibold">Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Upload Zone */}
            {!file && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${isDragging ? "scale-[0.99]" : "hover:border-amber-500/50"}`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
                  className="hidden"
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
                >
                  <Upload size={28} />
                </div>
                <h3 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Drop your Word document here
                </h3>
                <p className="font-body text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  .docx files supported · All processing is done in your browser
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Browse Files
                </button>
              </div>
            )}

            {/* File loaded state */}
            {file && (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-5"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}
              >
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
                        {pageCount > 0 && ` · ${pageCount} ${pageCount === 1 ? "page" : "pages"}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetTool}
                    className="font-body text-xs font-medium text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X size={14} /> Change file
                  </button>
                </div>

                {isProcessing && (
                  <div
                    className="p-4 rounded-xl border flex items-center gap-3"
                    style={{ backgroundColor: "var(--amber-tint)", borderColor: "rgba(200,123,58,0.25)" }}
                  >
                    <Loader2 size={18} className="animate-spin shrink-0 text-amber-500" />
                    <span className="font-body text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {conversionStatus}
                    </span>
                  </div>
                )}

                {hasRenderedDoc && !isProcessing && (
                  <>
                    <div
                      className="p-4 rounded-xl border flex items-center gap-3"
                      style={{ backgroundColor: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.3)" }}
                    >
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                      <span className="font-body text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {conversionStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={downloadPdf}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-sm"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={16} />
                        <span>Download PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={downloadPdf}
                        className="px-4 py-3 rounded-xl border font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                      >
                        <Printer size={16} />
                        <span>Print / Open PDF</span>
                      </button>
                    </div>

                    <div
                      className="font-body text-xs rounded-lg p-3"
                      style={{ color: "var(--text-secondary)", backgroundColor: "var(--amber-tint)" }}
                    >
                      <strong>How to save:</strong> A print window will open. In the print dialog, set Destination to &ldquo;Save as PDF&rdquo; (Chrome/Edge/Firefox) or &ldquo;Microsoft Print to PDF&rdquo; (Windows), then click Save.
                    </div>
                  </>
                )}

                {hasRenderedDoc && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Layers size={16} style={{ color: "var(--amber-primary)" }} />
                      <span className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        Document Preview {pageCount > 0 && `(${pageCount} ${pageCount === 1 ? "page" : "pages"})`}
                      </span>
                    </div>

                    <style>{`
                      .word-preview-host {
                        background: #f1f5f9;
                        border-radius: 12px;
                        border: 1px solid var(--border-warm);
                        padding: 20px 12px;
                        overflow: auto;
                        max-height: 680px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0;
                      }
                      .word-preview-host .docx-wrapper {
                        background: transparent !important;
                        padding: 0 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 20px !important;
                        width: 100% !important;
                      }
                      .word-preview-host .docx-wrapper > section,
                      .word-preview-host .docx-wrapper > article,
                      .word-preview-host .docx-page {
                        background: #ffffff !important;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.10) !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 4px !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                      }
                      .word-preview-host table { border-collapse: collapse; width: 100%; }
                      .word-preview-host td, .word-preview-host th { border: 1px solid #cbd5e1; padding: 4px 8px; }
                      .word-preview-host img { max-width: 100%; height: auto; }
                      .word-preview-host .docx-fallback-wrapper {
                        background: #fff;
                        padding: 32px;
                        border-radius: 4px;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.10);
                        width: 100%;
                        box-sizing: border-box;
                        line-height: 1.6;
                      }
                    `}</style>

                    <div
                      ref={previewRef}
                      className="word-preview-host"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </div>
                )}
              </div>
            )}

            <div
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}
              >
                <Shield size={18} />
              </div>
              <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>100% Private:</strong> Your Word files are processed entirely in your browser. Nothing is uploaded to any server.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                How to Save as PDF
              </h3>
              <ol className="space-y-3 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  ["Upload", "Upload your .docx file above."],
                  ["Click Download PDF", "A print preview window will open with your document."],
                  ["Choose Save as PDF", "In the print dialog, set Destination → Save as PDF."],
                  ["Click Save", "Your PDF is saved, matching the Word file exactly."],
                ].map(([step, desc], i) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: "var(--amber-primary)" }}>
                      {i + 1}
                    </span>
                    <span><strong>{step}:</strong> {desc}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Conversion Quality
              </h3>
              <ul className="space-y-2.5 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  ["Exact page count", "Same number of pages as the Word file"],
                  ["No line clipping", "Text is never cut between pages"],
                  ["Vector output", "Crisp text at any zoom level"],
                  ["Headers & Footers", "Rendered faithfully from the original"],
                ].map(([title, desc]) => (
                  <li key={title} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>{title}:</strong> {desc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
                Related PDF Tools
              </h3>
              <div className="flex flex-col gap-3 font-body text-sm">
                {[
                  { name: "PDF to Word", href: "/tools/pdf/to-word", icon: FileCheck },
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
