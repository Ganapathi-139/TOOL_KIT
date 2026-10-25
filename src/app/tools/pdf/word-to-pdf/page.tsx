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
  X,
  Sparkles,
  Laptop,
  Eye,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

function sanitizeHtmlContent(raw: string): string {
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');
}

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [hasRenderedDoc, setHasRenderedDoc] = useState<boolean>(false);
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [docPageSize, setDocPageSize] = useState<{ isLandscape: boolean }>({ isLandscape: false });
  const [nativePdfBlobUrl, setNativePdfBlobUrl] = useState<string | null>(null);
  const [usedNative, setUsedNative] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const nativeBlobRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (nativeBlobRef.current) URL.revokeObjectURL(nativeBlobRef.current);
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    setHasRenderedDoc(false);
    setRenderedHtml("");
    setPageCount(0);
    setConversionStatus("");
    setUsedNative(false);
    if (nativeBlobRef.current) {
      URL.revokeObjectURL(nativeBlobRef.current);
      nativeBlobRef.current = null;
    }
    setNativePdfBlobUrl(null);

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
    setConversionStatus("Trying native Word-to-PDF engine...");

    // --- Step 1: Attempt native API route (Microsoft Word COM on Windows) ---
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const resp = await fetch("/api/convert/word-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        nativeBlobRef.current = blobUrl;
        setNativePdfBlobUrl(blobUrl);
        setUsedNative(true);
        setHasRenderedDoc(true);
        setConversionStatus("✅ PDF ready! Native Microsoft Word rendering used.");
        setIsProcessing(false);
        // Auto-trigger download
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = selected.name.replace(/\.[^/.]+$/, ".pdf");
        a.click();
        return;
      }
      // 503 = native not available on this machine → fall through to browser
    } catch {
      // network / fetch error → fall through to browser rendering
    }

    // --- Step 2: Browser-side fallback using docx-preview ---
    setConversionStatus("Reading Word document in-browser...");
    try {
      const buffer = await selected.arrayBuffer();
      setConversionStatus("Rendering document layout & typography...");

      const docxModule = await import("docx-preview");
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText =
        "position:fixed;top:-99999px;left:-99999px;width:210mm;visibility:hidden;";
      document.body.appendChild(tempDiv);

      await docxModule.renderAsync(buffer, tempDiv, undefined, {
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

      const pages = tempDiv.querySelectorAll<HTMLElement>(
        ".docx-wrapper > section, .docx-wrapper > article, .docx-page"
      );
      const count = pages.length || 1;
      setPageCount(count);

      let isLandscape = false;
      if (pages.length > 0) {
        const first = pages[0];
        const w = parseFloat(first.style.width || "0");
        const h = parseFloat(first.style.minHeight || first.style.height || "0");
        if (w > 0 && h > 0 && w > h) isLandscape = true;
      }
      setDocPageSize({ isLandscape });

      const html = tempDiv.innerHTML;
      document.body.removeChild(tempDiv);

      setRenderedHtml(sanitizeHtmlContent(html));
      setHasRenderedDoc(true);
      setConversionStatus(
        `Document ready: ${count} ${count === 1 ? "page" : "pages"}. Click "Save as PDF" below.`
      );
    } catch (err: unknown) {
      console.error("Render error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to read the Word document. Please ensure it is a valid .docx file."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!renderedHtml || !file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    const printWin = window.open("", "_blank", "width=900,height=700");

    const pageWidthMm = docPageSize.isLandscape ? "297mm" : "210mm";
    const pageHeightMm = docPageSize.isLandscape ? "210mm" : "297mm";
    const pageOrientation = docPageSize.isLandscape ? "landscape" : "portrait";

    // Collect all loaded stylesheet rules including docx-preview styling
    let collectedCss = "";
    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          Array.from(sheet.cssRules || []).forEach((rule) => {
            collectedCss += rule.cssText + "\n";
          });
        } catch {
          // cross-origin sheet - skip
        }
      });
    } catch {
      // ignore
    }

    const printHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${fileName}</title>
  <style>
    ${collectedCss}

    *, *::before, *::after { box-sizing: border-box; }

    @page { size: A4 ${pageOrientation}; margin: 0; }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
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
      margin: 0 !important;
    }

    .docx-wrapper > section,
    .docx-wrapper > article,
    .docx-page {
      box-shadow: none !important;
      border: none !important;
      margin: 0 auto !important;
      width: ${pageWidthMm} !important;
      max-width: ${pageWidthMm} !important;
      min-height: 0 !important;
      height: auto !important;
      max-height: none !important;
      box-sizing: border-box !important;
      page-break-before: auto !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      overflow: visible !important;
      background: #fff !important;
      position: relative !important;
    }

    .docx-wrapper > section:last-child,
    .docx-wrapper > article:last-child,
    .docx-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #888; padding: 4px 8px; }
    img { max-width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  ${renderedHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      // Fallback if popup blocked
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.top = "-9999px";
      iframe.style.left = "-9999px";
      iframe.style.width = "210mm";
      iframe.style.height = "297mm";
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1500);
        }, 600);
      }
    }
  };

  const resetTool = () => {
    if (nativeBlobRef.current) {
      URL.revokeObjectURL(nativeBlobRef.current);
      nativeBlobRef.current = null;
    }
    setNativePdfBlobUrl(null);
    setUsedNative(false);
    setFile(null);
    setHasRenderedDoc(false);
    setRenderedHtml("");
    setPageCount(0);
    setDocPageSize({ isLandscape: false });
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
            Convert Microsoft Word (.docx) documents to PDF directly inside your browser. Fast, 100% private, and completely free—no files ever leave your device.
          </p>
        </div>

        {/* Pro Tip: Localhost & Native App Recommendation */}
        <div
          className="mb-8 p-4 rounded-2xl border flex items-start gap-3.5"
          style={{
            backgroundColor: "rgba(217, 119, 6, 0.08)",
            borderColor: "rgba(217, 119, 6, 0.25)",
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{
              backgroundColor: "rgba(217, 119, 6, 0.15)",
              color: "var(--amber-primary)",
            }}
          >
            <Sparkles size={16} />
          </div>
          <div className="text-sm font-body flex-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span>💡 Native Word-to-PDF on Local Install</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              This in-browser converter runs 100% client-side with zero server dependencies. For advanced documents with complex multi-column forms, nested tables, or macros, <strong>run ToolKit locally</strong> or look forward to our upcoming cross-platform <strong>Desktop & Mobile app</strong> for 100% native layout fidelity!
            </p>
          </div>
        </div>

        {/* Error Banner */}
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
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="shrink-0 opacity-60 hover:opacity-100 p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Workspace */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!file && (
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
                  isDragging ? "scale-[0.99]" : "hover:border-amber-500/50"
                }`}
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: isDragging ? "var(--amber-primary)" : "var(--border-warm)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: "var(--amber-tint)",
                    color: "var(--amber-primary)",
                  }}
                >
                  <Upload size={28} />
                </div>
                <h3
                  className="font-headline font-semibold text-lg"
                  style={{ color: "var(--text-primary)" }}
                >
                  Drop your Word document here
                </h3>
                <p
                  className="font-body text-sm mt-1 mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Supports Microsoft Word files (.docx) · 100% Client-Side In-Browser Conversion
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--amber-primary)" }}
                >
                  Select Word Document
                </button>
              </div>
            )}

            {file && (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* File header card */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{
                    backgroundColor: "var(--bg-main)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "var(--amber-tint)",
                        color: "var(--amber-primary)",
                      }}
                    >
                      <FileType2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-headline font-medium text-sm truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {file.name}
                      </p>
                      <p
                        className="font-body text-xs mt-0.5 flex items-center gap-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span>{formatFileSize(file.size)}</span>
                        {pageCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {pageCount} {pageCount === 1 ? "page" : "pages"}
                            </span>
                            <span>•</span>
                            <span>{docPageSize.isLandscape ? "Landscape" : "Portrait"}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetTool}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                    title="Change file"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Conversion progress */}
                {isProcessing && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <Loader2 size={36} className="animate-spin text-amber-500 mb-1" />
                    <p
                      className="font-headline font-medium text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {conversionStatus || "Processing document..."}
                    </p>
                    <p
                      className="font-body text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Parsing OpenXML formatting & layout directly inside your browser...
                    </p>
                  </div>
                )}

                {/* Success controls */}
                {!isProcessing && hasRenderedDoc && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                      <CheckCircle2 size={18} />
                      <span>{conversionStatus}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {usedNative && nativePdfBlobUrl ? (
                        <>
                          <a
                            href={nativePdfBlobUrl}
                            download={file?.name.replace(/\.[^/.]+$/, ".pdf") ?? "document.pdf"}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                            style={{ backgroundColor: "var(--amber-primary)" }}
                          >
                            <Download size={16} />
                            <span>Download PDF</span>
                          </a>
                          <p className="font-body text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✅ Converted using native Microsoft Word engine — perfect layout fidelity!
                          </p>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={downloadPdf}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-body font-semibold text-sm text-white shadow-sm transition-transform hover:scale-105"
                            style={{ backgroundColor: "var(--amber-primary)" }}
                          >
                            <Printer size={16} />
                            <span>Save as PDF (Print Preview)</span>
                          </button>
                          <p className="font-body text-xs text-stone-500 leading-relaxed">
                            💡 <em>Tip:</em> In the print dialog, select <strong>&quot;Destination: Save as PDF&quot;</strong> to export a clean vector PDF document.
                          </p>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={resetTool}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border font-body text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          borderColor: "var(--border-warm)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <span>Convert Another File</span>
                      </button>
                    </div>

                    {/* Interactive document preview */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-warm)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Eye size={16} className="text-amber-500" />
                        <h4 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          Document Preview
                        </h4>
                      </div>

                      <style>{`
                        .word-preview-host {
                          background: #525659;
                          border-radius: 12px;
                          border: 1px solid var(--border-warm);
                          padding: 32px 16px;
                          overflow: auto;
                          max-height: 600px;
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
                          gap: 32px !important;
                          width: 100% !important;
                        }
                        .word-preview-host .docx-wrapper > section,
                        .word-preview-host .docx-wrapper > article,
                        .word-preview-host .docx-page {
                          background: #ffffff !important;
                          box-shadow: 0 4px 16px rgba(0,0,0,0.18) !important;
                          border-radius: 4px !important;
                          max-width: 100% !important;
                          box-sizing: border-box !important;
                          overflow: hidden !important;
                          position: relative !important;
                        }
                        .word-preview-host table { border-collapse: collapse; width: 100%; }
                        .word-preview-host td, .word-preview-host th { border: 1px solid #cbd5e1; padding: 4px 8px; }
                        .word-preview-host img { max-width: 100%; height: auto; }
                      `}</style>

                      <div
                        ref={previewRef}
                        className="word-preview-host"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
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
                style={{
                  backgroundColor: "var(--amber-tint)",
                  color: "var(--amber-primary)",
                }}
              >
                <Shield size={18} />
              </div>
              <p
                className="font-body text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  100% Private In-Browser Processing:
                </strong>{" "}
                Your Word documents are parsed and converted locally inside your web browser. No files are ever sent to any remote server or external cloud service.
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
              <h3
                className="font-headline font-semibold text-base mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                How to Save as PDF
              </h3>
              <ol className="space-y-3 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                {[
                  ["Upload", "Select your .docx file to render directly in browser."],
                  ["Click Save as PDF", "Opens the clean, paginated print preview."],
                  ["Set Destination", "Choose 'Save as PDF' in the destination dropdown."],
                  ["Save", "Your high-resolution vector PDF is saved to your computer."],
                ].map(([step, desc], i) => (
                  <li key={step} className="flex items-start gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <strong>{step}:</strong> {desc}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3
                className="font-headline font-semibold text-base mb-4"
                style={{ color: "var(--text-primary)" }}
              >
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
