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
  Layers,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export default function WordToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [hasRenderedDoc, setHasRenderedDoc] = useState<boolean>(false);
  const [detectedPageCount, setDetectedPageCount] = useState<number>(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Clean up object URLs on unmount or file reset
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Dynamically load jszip, docx-preview, mammoth, and html2pdf scripts
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).JSZip = JSZip;
    }

    const loadScript = (src: string, fallbackSrc: string, globalName: string, onLoad?: () => void) => {
      if (typeof window === "undefined" || (window as unknown as Record<string, unknown>)[globalName]) {
        if (onLoad) onLoad();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      if (onLoad) script.onload = onLoad;
      script.onerror = () => {
        const fallback = document.createElement("script");
        fallback.src = fallbackSrc;
        fallback.async = true;
        if (onLoad) fallback.onload = onLoad;
        document.body.appendChild(fallback);
      };
      document.body.appendChild(script);
    };

    loadScript(
      "/js/jszip.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      "JSZip",
      () => {
        loadScript(
          "/js/docx-preview.min.js",
          "https://cdn.jsdelivr.net/npm/docx-preview@0.3.4/dist/docx-preview.min.js",
          "docx"
        );
      }
    );

    loadScript(
      "/js/html2pdf.bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
      "html2pdf"
    );
    loadScript(
      "/js/mammoth.browser.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js",
      "mammoth"
    );
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const waitForDocxEngine = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    for (let i = 0; i < 30; i++) {
      if (window.docx || window.mammoth) return true;
      await new Promise((r) => setTimeout(r, 150));
    }
    return Boolean(window.docx || window.mammoth);
  };

  const handleFile = async (selected: File) => {
    setErrorMessage(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfFileSize(null);
    setHasRenderedDoc(false);
    setDetectedPageCount(0);
    setConversionStatus("");

    const ext = selected.name.toLowerCase();
    if (!ext.endsWith(".docx") && !ext.endsWith(".doc")) {
      setErrorMessage("Please select a valid Word document (.docx format).");
      return;
    }

    if (ext.endsWith(".doc") && !ext.endsWith(".docx")) {
      setErrorMessage(
        "Legacy binary .doc files are not supported by web browser parsers. Please open your document in Microsoft Word, Google Docs, or LibreOffice and save/export as .docx before converting."
      );
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setConversionStatus("Reading Word document (.docx)...");

    try {
      const ready = await waitForDocxEngine();
      if (!ready) {
        throw new Error("Document rendering engine is still loading. Please try again in a moment.");
      }

      const buffer = await selected.arrayBuffer();
      setConversionStatus("Rendering authentic paginated document...");

      // Clear preview container
      const container = previewContainerRef.current;
      if (!container) {
        throw new Error("Preview container not initialized.");
      }
      container.innerHTML = "";

      if (typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).JSZip = JSZip;
      }

      // Render with docx-preview for true pagination and margins
      if (window.docx) {
        await window.docx.renderAsync(buffer, container, null, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true, // Key: preserves genuine Word document page breaks
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
        });

        // Count pages
        const pages = container.querySelectorAll(
          ".docx-wrapper > section, .docx-wrapper > article, .docx-page, section.docx, .docx > section"
        );
        const pageCount = pages.length > 0 ? pages.length : 1;
        setDetectedPageCount(pageCount);
        setHasRenderedDoc(true);
        setConversionStatus(`Document loaded with ${pageCount} ${pageCount === 1 ? "page" : "pages"}. Ready to convert.`);
      } else if (window.mammoth) {
        // Fallback with Mammoth if docx-preview is unavailable
        const res = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
        container.innerHTML = `
          <div class="docx-wrapper" style="background:#f8fafc;padding:24px 0;display:flex;flex-direction:column;align-items:center;">
            <section class="docx-page" style="background:#fff;padding:48px 56px;max-width:800px;width:100%;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);box-sizing:border-box;">
              ${res.value}
            </section>
          </div>
        `;
        setDetectedPageCount(1);
        setHasRenderedDoc(true);
        setConversionStatus("Document loaded. Ready to convert to PDF.");
      }
    } catch (err: unknown) {
      console.error("Word document rendering failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to parse Word document. Please ensure it is a valid .docx file."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const convertWordToPdf = async () => {
    if (!file || !previewContainerRef.current) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setConversionStatus("Starting page-by-page PDF generation...");

    try {
      const container = previewContainerRef.current;
      const html2canvasLib = window.html2canvas;

      // Find all genuine Word pages generated by docx-preview
      const pageElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          ".docx-wrapper > section, .docx-wrapper > article, .docx-page, section.docx, .docx > section"
        )
      );

      if (pageElements.length > 0 && html2canvasLib) {
        // High-fidelity page-by-page rendering: each Word page becomes an exact PDF page
        const pdfDoc = await PDFDocument.create();

        for (let idx = 0; idx < pageElements.length; idx++) {
          const pageEl = pageElements[idx];
          setConversionStatus(`Processing page ${idx + 1} of ${pageElements.length}...`);

          // Capture the exact single page with html2canvas (no cutting in half between pages!)
          const canvas = await html2canvasLib(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          });

          // Convert to JPEG data
          const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
          const base64Data = dataUrl.split(",")[1];
          const binaryStr = atob(base64Data);
          const imgBytes = new Uint8Array(binaryStr.length);
          for (let b = 0; b < binaryStr.length; b++) {
            imgBytes[b] = binaryStr.charCodeAt(b);
          }

          const embeddedImage = await pdfDoc.embedJpg(imgBytes);

          // Standard A4 dimensions: 595.28 x 841.89 points
          // Or calculate aspect ratio from the actual page canvas
          const pageAspectRatio = canvas.height / canvas.width;
          const pageWidth = 595.28;
          const pageHeight = pageWidth * pageAspectRatio;

          const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
          pdfPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });

          // Free canvas memory
          canvas.width = 0;
          canvas.height = 0;
        }

        setConversionStatus("Assembling PDF document...");
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });

        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        const url = URL.createObjectURL(pdfBlob);

        setPdfBlobUrl(url);
        setPdfFileSize(pdfBlob.size);
        setConversionStatus("Conversion complete!");
      } else if (window.html2pdf) {
        // Fallback to html2pdf if html2canvas page-by-page is unavailable
        setConversionStatus("Exporting document via html2pdf...");
        const opt = {
          margin: [8, 8, 8, 8],
          filename: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
          pagebreak: { mode: ["css", "legacy"] },
        };

        const pdfBlob: Blob = await window.html2pdf().set(opt).from(container).outputPdf("blob");

        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        const url = URL.createObjectURL(pdfBlob);

        setPdfBlobUrl(url);
        setPdfFileSize(pdfBlob.size);
        setConversionStatus("Conversion complete!");
      } else {
        throw new Error("PDF generation engine not available. Please refresh and try again.");
      }
    } catch (err: unknown) {
      console.error("Word to PDF generation failed:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to generate PDF. You can also use the 'Print / Vector PDF' option."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    const container = previewContainerRef.current;
    if (!container) return;

    const iframe = printFrameRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${file?.name || "Document"} - PDF Print</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #111;
              background: #fff;
              margin: 0;
              padding: 0;
            }
            .docx-wrapper { background: #fff !important; padding: 0 !important; }
            .docx-page, section { box-shadow: none !important; margin: 0 0 20px 0 !important; padding: 0 !important; page-break-after: always; }
            table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; }
            img { max-width: 100%; height: auto; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${container.innerHTML}
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
            Convert Microsoft Word documents (.docx) into accurate, paginated PDF files. Preserves exact page boundaries, headings, tables, and images without cutting lines.
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
                  Authentic page-by-page conversion right in your browser.
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
                        {detectedPageCount > 0 && ` • ${detectedPageCount} ${detectedPageCount === 1 ? "page" : "pages"}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl(null);
                      setHasRenderedDoc(false);
                      if (previewContainerRef.current) previewContainerRef.current.innerHTML = "";
                    }}
                    className="font-body text-xs font-medium text-red-500 hover:underline"
                  >
                    Change document
                  </button>
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

                {/* Action Button */}
                {hasRenderedDoc && !pdfBlobUrl && (
                  <button
                    type="button"
                    onClick={convertWordToPdf}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl font-body font-semibold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-sm"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Converting Word to PDF...</span>
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
                            {detectedPageCount > 0 && ` • ${detectedPageCount} pages`}
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
                        onClick={handlePrint}
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

                {/* Paginated Document Preview Section */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={16} style={{ color: "var(--amber-primary)" }} />
                      <span className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        Document Page Preview {detectedPageCount > 0 && `(${detectedPageCount} pages)`}
                      </span>
                    </div>
                    {hasRenderedDoc && (
                      <span className="text-xs font-body text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium">
                        Page breaks preserved
                      </span>
                    )}
                  </div>

                  {/* Authentic Paginated Document Viewer */}
                  <style>{`
                    .docx-preview-host {
                      background-color: #f1f5f9;
                      border-radius: 12px;
                      border: 1px solid var(--border-warm);
                      padding: 24px 16px;
                      overflow-x: auto;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                    }
                    .docx-preview-host .docx-wrapper {
                      background: transparent !important;
                      padding: 0 !important;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      gap: 24px;
                      width: 100%;
                    }
                    .docx-preview-host .docx-wrapper > section,
                    .docx-preview-host .docx-wrapper > article,
                    .docx-preview-host .docx-page {
                      background: #ffffff !important;
                      color: #111827 !important;
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                      margin-bottom: 24px !important;
                      box-sizing: border-box !important;
                      max-width: 100% !important;
                    }
                    .docx-preview-host table {
                      border-collapse: collapse;
                      width: 100%;
                    }
                    .docx-preview-host td, .docx-preview-host th {
                      border: 1px solid #cbd5e1;
                      padding: 6px 10px;
                    }
                    .docx-preview-host img {
                      max-width: 100%;
                      height: auto;
                    }
                  `}</style>
                  <div
                    ref={previewContainerRef}
                    className="docx-preview-host min-h-[200px]"
                  />
                </div>
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
                <strong className="font-semibold text-primary">100% Client-Side Privacy:</strong> Your Word files never touch any external server. Every page is rendered and compiled directly in your browser.
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
                Page Fidelity
              </h3>
              <ul className="space-y-2.5 text-xs font-body" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Exact page count:</strong> Preserves original document page breaks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Zero line clipping:</strong> Pages are compiled individually so text is never sliced in half.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Original layout:</strong> Tables, alignments, headings, and images stay on their designated pages.</span>
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
