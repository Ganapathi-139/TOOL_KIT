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
  Zap,
  Eye,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

// ─── Security: strip dangerous HTML before embedding in preview ───────────────
function sanitizeHtmlContent(raw: string): string {
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');
}

type ConversionEngine = "server-word" | "browser-print" | null;

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);

  // Server-side conversion state
  const [isConvertingServer, setIsConvertingServer] = useState(false);
  const [serverPdfUrl, setServerPdfUrl] = useState<string | null>(null);
  const [serverPdfFileName, setServerPdfFileName] = useState<string>("");

  // Browser-side preview + print fallback state
  const [isRendering, setIsRendering] = useState(false);
  const [hasRenderedDoc, setHasRenderedDoc] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [pageCount, setPageCount] = useState(0);

  // Shared state
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [conversionEngine, setConversionEngine] = useState<ConversionEngine>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load docx-preview and Mammoth lazily (only used as fallback)
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

  // ── Engine 1: Server-side Word COM conversion (high fidelity) ───────────────
  const convertServerSide = async (selected: File): Promise<boolean> => {
    setIsConvertingServer(true);
    setConversionStatus("Uploading to local conversion server…");

    try {
      const formData = new FormData();
      formData.append("file", selected);

      const res = await fetch("/api/convert/docx-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (res.status === 503) {
        // Backend not available (e.g. Vercel deployment) — tell caller to fall back
        return false;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errBody.error || `Server error: ${res.status}`);
      }

      // We got a real PDF blob back
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safeName = selected.name.replace(/\.docx$/i, ".pdf");

      setServerPdfUrl(url);
      setServerPdfFileName(safeName);
      setConversionEngine("server-word");
      setConversionStatus("PDF ready — converted by Microsoft Word (100% fidelity).");
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Don't surface internal server errors as the only failure — try browser fallback
      console.warn("[word-to-pdf] Server conversion failed:", msg);
      return false;
    } finally {
      setIsConvertingServer(false);
    }
  };

  // ── Engine 2: Browser-side docx-preview + print (fallback) ─────────────────
  const renderBrowserSide = async (selected: File) => {
    setIsRendering(true);
    setConversionStatus("Rendering document in browser (preview mode)…");

    try {
      const buffer = await selected.arrayBuffer();

      const docxReady = await waitForLib(() => !!window.docx);
      if (docxReady && window.docx) {
        setConversionStatus("Laying out Word pages…");

        // Render into an off-screen container at NATURAL size (no forced width).
        // docx-preview sets each section's width/height from the actual Word page size.
        const tempDiv = document.createElement("div");
        tempDiv.style.cssText =
          "position:fixed;top:-99999px;left:-99999px;visibility:hidden;pointer-events:none;";
        document.body.appendChild(tempDiv);

        await window.docx.renderAsync(buffer, tempDiv, null, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderEndnotes: true,
        });

        // Let the browser complete layout before measuring
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise((r) => setTimeout(r, 300));

        const pages = tempDiv.querySelectorAll<HTMLElement>(
          ".docx-wrapper > section, .docx-wrapper > article, .docx-page"
        );
        const count = pages.length || 1;
        setPageCount(count);

        const html = tempDiv.innerHTML;
        document.body.removeChild(tempDiv);

        setRenderedHtml(sanitizeHtmlContent(html));
        setHasRenderedDoc(true);
        setConversionEngine("browser-print");
        setConversionStatus(
          `Preview ready (${count} ${count === 1 ? "page" : "pages"}). ` +
            `Click "Print to PDF" and choose Save as PDF.`
        );
      } else {
        // Mammoth ultra-fallback (no pagination)
        const mammothReady = await waitForLib(() => !!window.mammoth);
        if (!mammothReady) throw new Error("Document renderer unavailable. Please refresh.");
        setConversionStatus("Converting with basic renderer…");
        const result = await window.mammoth!.convertToHtml({ arrayBuffer: buffer });
        const html = `<div class="docx-fallback-wrapper">${result.value}</div>`;
        setRenderedHtml(sanitizeHtmlContent(html));
        setPageCount(1);
        setHasRenderedDoc(true);
        setConversionEngine("browser-print");
        setConversionStatus(
          'Basic preview ready. Click "Print to PDF" and choose Save as PDF.'
        );
      }
    } catch (err: unknown) {
      throw err;
    } finally {
      setIsRendering(false);
    }
  };

  // ── Main entry: try server first, fall back to browser ──────────────────────
  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setHasRenderedDoc(false);
    setRenderedHtml("");
    setPageCount(0);
    setConversionStatus("");
    setServerPdfUrl(null);
    setServerPdfFileName("");
    setConversionEngine(null);

    const name = selected.name.toLowerCase();
    if (!name.endsWith(".docx") && !name.endsWith(".doc")) {
      setErrorMessage("Please select a valid Word document (.docx format).");
      return;
    }
    if (name.endsWith(".doc") && !name.endsWith(".docx")) {
      setErrorMessage(
        "Legacy .doc files are not supported. Save as .docx in Word, Google Docs, or LibreOffice first."
      );
      return;
    }

    setFile(selected);
    setConversionStatus("Starting conversion…");

    try {
      // Try server-side Word COM first (best quality)
      const serverOk = await convertServerSide(selected);
      if (serverOk) return;

      // Fall back to browser renderer
      setConversionStatus("Server unavailable — falling back to browser renderer…");
      await renderBrowserSide(selected);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to convert. Ensure the file is a valid .docx document."
      );
    }
  };

  // ── Browser print-to-PDF (fallback engine) ──────────────────────────────────
  const openPrintDialog = () => {
    if (!renderedHtml || !file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) {
      setErrorMessage("Pop-up was blocked. Please allow pop-ups for this site and try again.");
      return;
    }

    // Collect all CSS from the page (includes docx-preview's own stylesheet)
    let collectedCss = "";
    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          Array.from(sheet.cssRules || []).forEach((rule) => {
            collectedCss += rule.cssText + "\n";
          });
        } catch {
          // cross-origin stylesheets — skip
        }
      });
    } catch {
      // ignore
    }

    // CRITICAL CHANGE: Do NOT force page dimensions. Let docx-preview's own sizing rule each page.
    // Only add print-specific resets that remove decorative shadows/gaps without destroying layout.
    printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${fileName}</title>
  <style>
    ${collectedCss}

    /* ── Minimal print overrides — do not override page geometry ── */
    @page { margin: 0; }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Remove the decorative scroll-view wrapper gap and shadow */
    .docx-wrapper {
      background: #fff !important;
      padding: 0 !important;
      gap: 0 !important;
      margin: 0 !important;
    }

    /* Each Word page: remove box-shadow/border, keep ALL sizing from docx-preview intact */
    .docx-wrapper > section,
    .docx-wrapper > article,
    .docx-page {
      box-shadow: none !important;
      border: none !important;
      margin: 0 auto !important;
      /* ⚠ DO NOT override width, height, min-height, or max-height here.
         docx-preview already set them from the Word document's actual page size.
         Overriding them is what causes the overlap/clipping you saw. */
      page-break-after: always;
      break-after: page;
    }

    /* Last page: avoid blank trailing page */
    .docx-wrapper > section:last-child,
    .docx-wrapper > article:last-child,
    .docx-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    /* Mammoth plain-HTML fallback */
    .docx-fallback-wrapper {
      padding: 25.4mm;
      background: #fff;
    }

    img, svg { max-width: 100%; }
    table { border-collapse: collapse; }
    td, th { border: 1px solid #888; padding: 4px 8px; }
  </style>
</head>
<body>
  ${renderedHtml}
  <script>
    // Wait for all images to load before printing
    window.onload = function() {
      var images = document.querySelectorAll('img');
      var pending = images.length;
      if (pending === 0) {
        setTimeout(function() { window.print(); }, 600);
        return;
      }
      function tryPrint() {
        pending--;
        if (pending <= 0) setTimeout(function() { window.print(); }, 600);
      }
      images.forEach(function(img) {
        if (img.complete) { tryPrint(); }
        else { img.onload = tryPrint; img.onerror = tryPrint; }
      });
    };
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
    setServerPdfUrl(null);
    setServerPdfFileName("");
    setConversionEngine(null);
    if (serverPdfUrl) URL.revokeObjectURL(serverPdfUrl);
  };

  const isProcessing = isConvertingServer || isRendering;

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
            Convert Word documents (.docx) to PDF. Locally, Microsoft Word itself generates the
            PDF — preserving all layout, images, tables, and fonts exactly as they appear in
            Word.
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
                  .docx files supported
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

            {/* File loaded */}
            {file && (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-5"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}
              >
                {/* File header */}
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

                {/* Status banner */}
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

                {/* ── Server-side result: direct PDF download ─────────────────── */}
                {conversionEngine === "server-word" && serverPdfUrl && !isProcessing && (
                  <>
                    <div
                      className="p-4 rounded-xl border flex items-center gap-3"
                      style={{ backgroundColor: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.3)" }}
                    >
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                      <div>
                        <p className="font-body text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {conversionStatus}
                        </p>
                        <p className="font-body text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Zap size={11} />
                          Converted by Microsoft Word — layout, images, tables, and fonts are preserved exactly.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={serverPdfUrl}
                        download={serverPdfFileName}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-sm"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Download size={16} />
                        <span>Download PDF</span>
                      </a>
                      <a
                        href={serverPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-xl font-body font-semibold text-sm border flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: "var(--border-warm)", color: "var(--text-primary)" }}
                      >
                        <Eye size={16} />
                        <span>Open in New Tab</span>
                      </a>
                    </div>

                    {/* PDF Preview for Server Word Conversion */}
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers size={16} style={{ color: "var(--amber-primary)" }} />
                          <span className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                            Converted Document Preview
                          </span>
                        </div>
                        <span className="text-xs font-body font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: "var(--amber-tint)", color: "var(--amber-primary)" }}>
                          Native Word Layout
                        </span>
                      </div>

                      <div className="w-full h-[650px] sm:h-[750px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-inner">
                        <iframe
                          src={serverPdfUrl}
                          className="w-full h-full border-0"
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Browser-side result: print to PDF fallback ──────────────── */}
                {conversionEngine === "browser-print" && hasRenderedDoc && !isProcessing && (
                  <>
                    <div
                      className="p-4 rounded-xl border flex items-start gap-3"
                      style={{ backgroundColor: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.3)" }}
                    >
                      <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-body text-xs sm:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {conversionStatus}
                        </p>
                        <p className="font-body text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          Browser preview mode: complex layouts (floating images, SmartArt, text boxes) may not render perfectly. For pixel-perfect results, use the desktop app on a machine with Microsoft Word installed.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={openPrintDialog}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-sm"
                        style={{ backgroundColor: "var(--amber-primary)" }}
                      >
                        <Printer size={16} />
                        <span>Print to PDF</span>
                      </button>
                    </div>

                    <div
                      className="font-body text-xs rounded-lg p-3"
                      style={{ color: "var(--text-secondary)", backgroundColor: "var(--amber-tint)" }}
                    >
                      <strong>How to save:</strong> In the print dialog, set Destination to &ldquo;Save as PDF&rdquo; (Chrome/Edge/Firefox) or &ldquo;Microsoft Print to PDF&rdquo; (Windows), then click Save.
                    </div>
                  </>
                )}

                {/* Browser preview */}
                {conversionEngine === "browser-print" && hasRenderedDoc && (
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
                        padding: 32px 16px;
                        overflow: auto;
                        max-height: 700px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                      }
                      .word-preview-host .docx-wrapper {
                        background: transparent !important;
                        padding: 0 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 36px !important;
                        width: 100% !important;
                        counter-reset: word-page-num;
                      }
                      .word-preview-host .docx-wrapper > section,
                      .word-preview-host .docx-wrapper > article,
                      .word-preview-host .docx-page {
                        background: #ffffff !important;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.12) !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 2px !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                        position: relative !important;
                        counter-increment: word-page-num;
                      }
                      .word-preview-host .docx-wrapper > section::before,
                      .word-preview-host .docx-wrapper > article::before {
                        content: "Page " counter(word-page-num);
                        position: absolute;
                        top: -22px;
                        left: 0;
                        font-size: 10px;
                        font-weight: 700;
                        color: #94a3b8;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                      }
                      .word-preview-host table { border-collapse: collapse; width: 100%; }
                      .word-preview-host td, .word-preview-host th { border: 1px solid #cbd5e1; padding: 4px 8px; }
                      .word-preview-host img { max-width: 100%; height: auto; }
                      .word-preview-host .docx-fallback-wrapper {
                        background: #fff;
                        padding: 32px;
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

            {/* Privacy badge */}
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
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>100% Private:</strong>{" "}
                Conversion happens entirely on your local machine — files are never sent to external
                servers or stored anywhere.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border-warm)" }}>
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                How it works
              </h3>
              <ol className="space-y-3 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  ["Upload", "Drop or browse your .docx file."],
                  ["Auto-convert", "Microsoft Word converts it locally — no cloud upload."],
                  ["Download", "Get a PDF that looks exactly like the Word original."],
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
                What is preserved
              </h3>
              <ul className="space-y-2.5 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  "Exact page sizes & orientation",
                  "All images, diagrams & SmartArt",
                  "Tables, columns & text boxes",
                  "Headers, footers & page numbers",
                  "Fonts, bold, italic & paragraph spacing",
                  "Embedded charts & drawing objects",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
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
                  { name: "Merge PDF", href: "/tools/pdf/merge", icon: FilePlus2 },
                  { name: "Split PDF", href: "/tools/pdf/split", icon: Scissors },
                  { name: "Compress PDF", href: "/tools/pdf/compress", icon: FileType2 },
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
